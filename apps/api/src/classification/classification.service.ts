import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WeatherEvent, WEATHER_EVENT_TYPES } from '@mausamnet/shared';
import {
  ClassificationResponse,
  MlClientService,
} from '../ml-client/ml-client.service';
import { Report } from '../entities/report.entity';

@Injectable()
export class ClassificationService {
  constructor(
    private readonly mlClient: MlClientService,
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
  ) {}

  async classify(text: string, reportId?: string) {
    const result = await this.mlClient.classify(text);

    if (reportId) {
      await this.persistResult(reportId, result);
    }

    return result;
  }

  private async persistResult(
    reportId: string,
    result: ClassificationResponse,
  ): Promise<Report> {
    const report = await this.reportRepository.findOne({
      where: { id: reportId },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    if (WEATHER_EVENT_TYPES.includes(result.eventType as WeatherEvent)) {
      report.eventType = result.eventType as WeatherEvent;
    } else if (!report.eventType) {
      report.eventType = WeatherEvent.OTHER;
    }

    return this.reportRepository.save(report);
  }
}