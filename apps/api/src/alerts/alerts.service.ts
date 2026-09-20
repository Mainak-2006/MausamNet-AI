import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventCategory, Severity, SourceType } from '@prisma/client';
import { AuthedUser } from '../auth/types';
import {
  AUTO_ALERT_DUPLICATE_WINDOW_MS,
  AUTO_ALERT_DURATION_MS,
  AUTO_ALERT_MIN_CREDIBILITY,
  AUTO_ALERT_MIN_SEVERITY,
  severityRank,
} from '../common/constants';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAlertDto } from './dto/create-alert.dto';

export interface VerifiableReport {
  id: string;
  title: string;
  description?: string | null;
  category: EventCategory;
  severity: Severity;
  city?: string | null;
  state?: string | null;
  credibilityScore: number;
  verifiedById?: string | null;
}

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async listActive() {
    const now = new Date();
    return this.prisma.alert.findMany({
      where: {
        isActive: true,
        OR: [{ endAt: null }, { endAt: { gt: now } }],
      },
      orderBy: { startAt: 'desc' },
      include: {
        createdBy: { select: { id: true, name: true } },
      },
    });
  }

  async findOne(id: string) {
    const alert = await this.prisma.alert.findUnique({ where: { id } });
    if (!alert) throw new NotFoundException('Alert not found');
    return alert;
  }

  async create(user: AuthedUser, dto: CreateAlertDto) {
    const alert = await this.prisma.alert.create({
      data: {
        title: dto.title,
        message: dto.message,
        category: dto.category,
        severity: dto.severity,
        city: dto.city,
        state: dto.state,
        startAt: dto.startAt ? new Date(dto.startAt) : undefined,
        endAt: dto.endAt ? new Date(dto.endAt) : undefined,
        source: SourceType.CITIZEN,
        createdById: user.id,
      },
    });
    return alert;
  }

  async setActive(id: string, isActive: boolean) {
    const alert = await this.prisma.alert.findUnique({ where: { id } });
    if (!alert) throw new NotFoundException('Alert not found');
    return this.prisma.alert.update({
      where: { id },
      data: { isActive },
    });
  }

  /**
   * Whether a verified (or verifiable) report qualifies for an automatic
   * alert: feature enabled, severity/credibility thresholds met, a location
   * present, and no recent duplicate alert for the same event.
   */
  async canAutoPublish(report: VerifiableReport): Promise<boolean> {
    if (this.config.get<string>('AUTO_ALERTS_ENABLED', 'true') === 'false') {
      return false;
    }
    if (severityRank(report.severity) < severityRank(AUTO_ALERT_MIN_SEVERITY)) {
      return false;
    }
    if (report.credibilityScore < AUTO_ALERT_MIN_CREDIBILITY) {
      return false;
    }
    if (!report.city && !report.state) {
      return false;
    }
    const existing = await this.prisma.alert.findFirst({
      where: {
        title: report.title,
        category: report.category,
        city: report.city ?? null,
        isActive: true,
        startAt: {
          gte: new Date(Date.now() - AUTO_ALERT_DUPLICATE_WINDOW_MS),
        },
      },
    });
    return !existing;
  }

  async createFromVerifiedReport(report: VerifiableReport) {
    if (!(await this.canAutoPublish(report))) {
      return null;
    }

    const now = new Date();
    const alert = await this.prisma.alert.create({
      data: {
        title: report.title,
        message:
          report.description ??
          `A verified ${report.category.replace(/_/g, ' ').toLowerCase()} event was reported${
            report.city ? ` in ${report.city}` : ''
          }.`,
        category: report.category,
        severity: report.severity,
        city: report.city ?? undefined,
        state: report.state ?? undefined,
        startAt: now,
        endAt: new Date(now.getTime() + AUTO_ALERT_DURATION_MS),
        source: SourceType.CITIZEN,
        createdById: report.verifiedById ?? undefined,
      },
    });

    this.logger.log(
      `Auto-created alert ${alert.id} from verified report ${report.id}`,
    );
    return alert;
  }
}