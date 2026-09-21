import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  EventCategory,
  MediaType,
  Prisma,
  ReportStatus,
  SourceType,
} from '@prisma/client';
import { AlertsService } from '../alerts/alerts.service';
import { AuditService } from '../audit/audit.service';
import { AuthedUser } from '../auth/types';
import { MlService } from '../ml/ml.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateReportDto,
  UpdateReportDto,
} from './dto/create-report.dto';
import { QueryReportsDto } from './dto/query-reports.dto';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ml: MlService,
    private readonly audit: AuditService,
    private readonly alerts: AlertsService,
  ) {}

  async list(query: QueryReportsDto, isAdminView = false) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Prisma.ReportWhereInput = {};
    if (!isAdminView) {
      where.status = { in: [ReportStatus.PENDING, ReportStatus.VERIFIED] };
    } else if (query.status) {
      where.status = query.status;
    }
    if (query.category) where.category = query.category;
    if (query.severity) where.severity = query.severity;
    if (query.state) {
      where.state = { equals: query.state, mode: 'insensitive' };
    }
    if (query.city) {
      where.city = { contains: query.city, mode: 'insensitive' };
    }
    if (query.from || query.to) {
      where.reportedAt = {
        ...(query.from ? { gte: this.parseDate(query.from) } : {}),
        ...(query.to ? { lte: this.parseDate(query.to) } : {}),
      };
    }
    if (query.q) {
      const contains = { contains: query.q, mode: 'insensitive' as const };
      where.OR = [
        { title: contains },
        { description: contains },
        { city: contains },
        { state: contains },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.report.findMany({
        where,
        orderBy: { reportedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          author: {
            select: { id: true, name: true, avatarUrl: true, credibilityScore: true },
          },
          media: true,
        },
      }),
      this.prisma.report.count({ where }),
    ]);

    return {
      data,
      meta: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const report = await this.prisma.report.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, name: true, avatarUrl: true, credibilityScore: true },
        },
        verifier: {
          select: { id: true, name: true },
        },
        media: true,
      },
    });
    if (!report) throw new NotFoundException('Report not found');
    const visibleToPublic: ReportStatus[] = [
      ReportStatus.PENDING,
      ReportStatus.VERIFIED,
    ];
    if (!visibleToPublic.includes(report.status)) {
      throw new NotFoundException('Report not found');
    }
    return report;
  }

  async create(user: AuthedUser, dto: CreateReportDto, ip?: string) {
    const text = `${dto.title} ${dto.description ?? ''}`.trim();
    const prediction = await this.ml.classify(text);
    const category =
      dto.category ?? prediction.category ?? EventCategory.OTHER;
    const duplicates = await this.ml.findDuplicates({
      category,
      text,
      city: dto.city,
      latitude: dto.latitude,
      longitude: dto.longitude,
    });
    const isDuplicate = duplicates.isDuplicate;
    const trust = this.ml.assessTrust({
      aiConfidence: prediction.confidence,
      aiMethod: prediction.method,
      latitude: dto.latitude,
      longitude: dto.longitude,
      mediaCount: dto.media?.length,
      city: dto.city,
      state: dto.state,
      isDuplicate,
      userCredibility: user.credibilityScore,
      source: SourceType.CITIZEN,
    });
    const credibilityScore = trust.score;
    const severity =
      dto.severity ?? this.ml.inferSeverity(category, prediction.confidence);

    const report = await this.prisma.report.create({
      data: {
        title: dto.title,
        description: dto.description,
        category,
        severity,
        status: ReportStatus.PENDING,
        city: dto.city,
        state: dto.state,
        latitude: dto.latitude,
        longitude: dto.longitude,
        source: SourceType.CITIZEN,
        aiPrediction: prediction.category ?? category,
        aiConfidence: prediction.confidence,
        credibilityScore,
        isDuplicate,
        duplicateOfId: duplicates.duplicateOfId,
        authorId: user.id,
        media: {
          create:
            dto.media?.map((m) => ({
              url: m.url,
              type: m.type ?? MediaType.IMAGE,
              uploaderId: user.id,
            })) ?? [],
        },
      },
      include: {
        media: true,
        author: {
          select: { id: true, name: true, avatarUrl: true, credibilityScore: true },
        },
      },
    });

    await this.audit.record(
      user.id,
      'report.create',
      'Report',
      report.id,
      { category, aiConfidence: prediction.confidence, isDuplicate },
      ip,
    );

    if (await this.alerts.canAutoPublish(report)) {
      await this.prisma.report.update({
        where: { id: report.id },
        data: { status: ReportStatus.VERIFIED, verifiedAt: new Date() },
      });
      const autoAlert = await this.alerts.createFromVerifiedReport(report);
      if (autoAlert) {
        report.status = ReportStatus.VERIFIED;
        report.verifiedAt = new Date();
        this.logger.log(
          `Auto-verified report ${report.id} and published alert ${autoAlert.id}`,
        );
        await this.audit.record(
          user.id,
          'report.auto_verified',
          'Report',
          report.id,
          { autoAlert: true },
          ip,
        );
        await this.audit.record(
          user.id,
          'alert.auto_create',
          'Alert',
          autoAlert.id,
          { reportId: report.id },
          ip,
        );
      }
    }

    return report;
  }

  async update(user: AuthedUser, id: string, dto: UpdateReportDto, ip?: string) {
    const report = await this.prisma.report.findUnique({ where: { id } });
    if (!report) throw new NotFoundException('Report not found');

    const isAuthor = report.authorId === user.id;
    const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
    if (!isAuthor && !isAdmin) throw new ForbiddenException('Not allowed');

    const editableByAuthor =
      report.status === ReportStatus.PENDING ||
      report.status === ReportStatus.UNVERIFIED;
    if (isAuthor && !isAdmin && !editableByAuthor) {
      throw new ForbiddenException('Report already verified; contact an admin');
    }

    const text = `${dto.title ?? report.title} ${dto.description ?? report.description ?? ''}`.trim();
    const prediction = await this.ml.classify(text);

    const data: Prisma.ReportUpdateInput = {
      title: dto.title ?? undefined,
      description: dto.description ?? undefined,
      city: dto.city ?? undefined,
      state: dto.state ?? undefined,
      latitude: dto.latitude ?? undefined,
      longitude: dto.longitude ?? undefined,
      severity: dto.severity ?? undefined,
      aiPrediction: prediction.category ?? undefined,
      aiConfidence: prediction.confidence ?? undefined,
    };
    if (dto.category) {
      data.category = dto.category;
      data.status = ReportStatus.PENDING;
    }

    const updated = await this.prisma.report.update({
      where: { id },
      data,
      include: { media: true, author: true },
    });

    await this.audit.record(
      user.id,
      'report.update',
      'Report',
      id,
      { fields: Object.keys(dto) },
      ip,
    );
    return updated;
  }

  async remove(user: AuthedUser, id: string, ip?: string) {
    const report = await this.prisma.report.findUnique({ where: { id } });
    if (!report) throw new NotFoundException('Report not found');
    const isAuthor = report.authorId === user.id;
    const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
    if (!isAuthor && !isAdmin) throw new ForbiddenException('Not allowed');

    await this.prisma.report.delete({ where: { id } });
    await this.audit.record(user.id, 'report.delete', 'Report', id, {}, ip);
    return { ok: true };
  }

  async updateStatus(
    user: AuthedUser,
    id: string,
    status: ReportStatus,
    notes?: string,
    ip?: string,
  ) {
    const report = await this.prisma.report.findUnique({ where: { id } });
    if (!report) throw new NotFoundException('Report not found');

    const updated = await this.prisma.report.update({
      where: { id },
      data: {
        status,
        verificationNotes: notes ?? undefined,
        verifiedById: user.id,
        verifiedAt:
          status === ReportStatus.VERIFIED || status === ReportStatus.REJECTED
            ? new Date()
            : undefined,
      },
      include: { media: true, author: true },
    });

    if (status === ReportStatus.VERIFIED) {
      try {
        const autoAlert = await this.alerts.createFromVerifiedReport(updated);
        if (autoAlert) {
          await this.audit.record(
            user.id,
            'alert.auto_create',
            'Alert',
            autoAlert.id,
            { reportId: id },
            ip,
          );
        }
      } catch (err) {
        this.logger.warn(
          `Failed to auto-create alert for report ${id}: ${String(err)}`,
        );
      }
    }

    await this.audit.record(
      user.id,
      `report.${status.toLowerCase()}`,
      'Report',
      id,
      { notes },
      ip,
    );
    return updated;
  }

  private parseDate(value: string): Date {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? new Date() : date;
  }
}