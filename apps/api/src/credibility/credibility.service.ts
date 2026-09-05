import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReportSource } from '@mausamnet/shared';
import { MlClientService } from '../ml-client/ml-client.service';
import { Report } from '../entities/report.entity';

export interface ScoreCredibilityParams {
  text: string;
  source: ReportSource;
  hasMedia?: boolean;
  hasLocation?: boolean;
  reportId?: string;
}

@Injectable()
export class CredibilityService {
  constructor(
    private readonly mlClient: MlClientService,
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
  ) {}

  async score(params: ScoreCredibilityParams) {
    const result = await this.mlClient.scoreCredibility({
      text: params.text,
      source: params.source,
      hasMedia: params.hasMedia,
      hasLocation: params.hasLocation,
    });

    if (params.reportId) {
      await this.persistScore(params.reportId, result.score);
    }

    return result;
  }

  private async persistScore(reportId: string, score: number): Promise<Report> {
    const report = await this.reportRepository.findOne({
      where: { id: reportId },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    report.credibilityScore = score;
    return this.reportRepository.save(report);
  }
}