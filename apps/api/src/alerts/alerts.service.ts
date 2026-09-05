import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AlertSeverity } from '@mausamnet/shared';
import { Alert } from '../entities/alert.entity';
import { Report } from '../entities/report.entity';

export interface CreateAlertParams {
  reportId: string;
  title: string;
  message: string;
  severity?: AlertSeverity;
}

@Injectable()
export class AlertsService {
  constructor(
    @InjectRepository(Alert)
    private readonly alertRepository: Repository<Alert>,
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
  ) {}

  async create(params: CreateAlertParams): Promise<Alert> {
    const report = await this.reportRepository.findOne({
      where: { id: params.reportId },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    const alert = this.alertRepository.create({
      reportId: params.reportId,
      title: params.title,
      message: params.message,
      eventType: report.eventType,
      severity: params.severity ?? AlertSeverity.MEDIUM,
    });

    return this.alertRepository.save(alert);
  }

  async findActive(): Promise<Alert[]> {
    return this.alertRepository.find({
      where: { isActive: true },
      relations: { report: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findByReportId(reportId: string): Promise<Alert[]> {
    return this.alertRepository.find({
      where: { reportId },
      order: { createdAt: 'DESC' },
    });
  }

  async setActive(id: string, isActive: boolean): Promise<Alert> {
    const alert = await this.alertRepository.findOne({ where: { id } });

    if (!alert) {
      throw new NotFoundException('Alert not found');
    }

    alert.isActive = isActive;
    return this.alertRepository.save(alert);
  }

  async remove(id: string): Promise<{ message: string }> {
    const alert = await this.alertRepository.findOne({ where: { id } });

    if (!alert) {
      throw new NotFoundException('Alert not found');
    }

    await this.alertRepository.remove(alert);

    return { message: 'Alert deleted successfully' };
  }
}