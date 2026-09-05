import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MlClientService } from '../ml-client/ml-client.service';
import { Report } from '../entities/report.entity';

export interface DetectDuplicateParams {
  text: string;
  reportId?: string;
  threshold?: number;
  limit?: number;
}

@Injectable()
export class DuplicatesService {
  constructor(
    private readonly mlClient: MlClientService,
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
  ) {}

  async detect(params: DetectDuplicateParams) {
    const existing = await this.reportRepository.find({
      select: { id: true, description: true },
      take: params.limit ?? 50,
      order: { createdAt: 'DESC' },
    });

    const candidates = params.reportId
      ? existing.filter((report) => report.id !== params.reportId)
      : existing;

    const result = await this.mlClient.detectDuplicates(
      params.text,
      candidates.map((report) => report.description),
      params.threshold,
    );

    let duplicateOfId: string | null = null;

    if (result.isDuplicate && result.similarToIndex !== null) {
      duplicateOfId = candidates[result.similarToIndex]?.id ?? null;
    }

    if (params.reportId && result.isDuplicate && duplicateOfId) {
      await this.persistDuplicate(params.reportId, duplicateOfId);
    }

    return {
      ...result,
      duplicateOfId,
    };
  }

  private async persistDuplicate(
    reportId: string,
    duplicateOfId: string,
  ): Promise<void> {
    const report = await this.reportRepository.findOne({
      where: { id: reportId },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    report.isDuplicate = true;
    report.duplicateOfId = duplicateOfId;
    await this.reportRepository.save(report);
  }
}