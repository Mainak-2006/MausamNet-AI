import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, LessThanOrEqual, MoreThanOrEqual, IsNull } from 'typeorm';
import { Report } from '../entities/report.entity';
import { CreateReportDto, UpdateReportDto, FilterReportsDto } from './dto/report.dto';
import { UserRole } from '@mausamnet/shared';
import { ReportProcessingService } from './report-processing.service';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
    private readonly reportProcessingService: ReportProcessingService,
  ) {}

  async create(dto: CreateReportDto, userId: string): Promise<Report> {
    const report = this.reportRepository.create({
      ...dto,
      userId,
    });

    const saved = await this.reportRepository.save(report);

    void this.reportProcessingService.processReport(saved.id);

    return saved;
  }

  async findAll(
    filters: FilterReportsDto,
  ): Promise<{ data: Report[]; total: number; page: number; limit: number; totalPages: number }> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<Report> = {};

    if (filters.eventType) {
      where.eventType = filters.eventType;
    }

    if (filters.verificationStatus) {
      where.verificationStatus = filters.verificationStatus;
    }

    if (filters.city) {
      where.city = filters.city;
    }

    if (filters.state) {
      where.state = filters.state;
    }

    if (filters.dateFrom || filters.dateTo) {
      if (filters.dateFrom && filters.dateTo) {
        where.reportDate = MoreThanOrEqual(new Date(filters.dateFrom)) as FindOptionsWhere<Report>['reportDate'];
      } else if (filters.dateFrom) {
        where.reportDate = MoreThanOrEqual(new Date(filters.dateFrom));
      } else if (filters.dateTo) {
        where.reportDate = LessThanOrEqual(new Date(filters.dateTo));
      }
    }

    const sortBy = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder || 'DESC';

    const [data, total] = await this.reportRepository.findAndCount({
      where,
      order: { [sortBy]: sortOrder },
      skip,
      take: limit,
      relations: { user: true },
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<Report> {
    const report = await this.reportRepository.findOne({
      where: { id },
      relations: {
        user: true,
        media: true,
        verifications: { user: true },
      },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    return report;
  }

  async update(
    id: string,
    dto: UpdateReportDto,
    userId: string,
    userRole: UserRole,
  ): Promise<Report> {
    const report = await this.findById(id);

    if (report.userId !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('You can only update your own reports');
    }

    Object.assign(report, dto);
    const saved = await this.reportRepository.save(report);

    if (dto.description || dto.eventType) {
      void this.reportProcessingService.processReport(saved.id);
    }

    return saved;
  }

  async remove(
    id: string,
    userId: string,
    userRole: UserRole,
  ): Promise<{ message: string }> {
    const report = await this.findById(id);

    if (report.userId !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('You can only delete your own reports');
    }

    await this.reportRepository.remove(report);

    return { message: 'Report deleted successfully' };
  }

  async backfillUnprocessed(limit?: number): Promise<{
    queued: number;
    limit: number;
  }> {
    const cap = Math.min(Math.floor(limit ?? 100), 200);

    const unprocessed = await this.reportRepository.find({
      where: { processedAt: IsNull() },
      take: cap,
      order: { createdAt: 'ASC' },
      select: { id: true },
    });

    for (const report of unprocessed) {
      void this.reportProcessingService.processReport(report.id);
    }

    return { queued: unprocessed.length, limit: cap };
  }

  async findNearby(
    lat: number,
    lng: number,
    radiusKm: number,
    eventType?: string,
  ): Promise<Report[]> {
    const query = this.reportRepository
      .createQueryBuilder('report')
      .select([
        'report.id',
        'report.title',
        'report.latitude',
        'report.longitude',
        'report.eventType',
        'report.city',
        'report.state',
      ])
      .addSelect(
        `ST_Distance(
          ST_SetSRID(ST_MakePoint(report.longitude, report.latitude), 4326)::geography,
          ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography
        ) / 1000`,
        'distance',
      )
      .where(
        `ST_DWithin(
          ST_SetSRID(ST_MakePoint(report.longitude, report.latitude), 4326)::geography,
          ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
          :radius * 1000
        )`,
        { lat, lng, radius: radiusKm },
      )
      .orderBy('distance', 'ASC');

    if (eventType) {
      query.andWhere('report.eventType = :eventType', { eventType });
    }

    const reports = await query.getRawMany();

    return reports.map((r) => ({
      ...r,
      distance: parseFloat(r.distance),
    })) as unknown as Report[];
  }
}