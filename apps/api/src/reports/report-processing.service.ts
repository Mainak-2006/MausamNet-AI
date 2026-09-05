import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClassificationService } from '../classification/classification.service';
import { CredibilityService } from '../credibility/credibility.service';
import { DuplicatesService } from '../duplicates/duplicates.service';
import { Report } from '../entities/report.entity';

@Injectable()
export class ReportProcessingService {
  private readonly logger = new Logger(ReportProcessingService.name);

  constructor(
    private readonly classificationService: ClassificationService,
    private readonly credibilityService: CredibilityService,
    private readonly duplicatesService: DuplicatesService,
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
  ) {}

  async processReport(reportId: string): Promise<void> {
    const report = await this.reportRepository.findOne({
      where: { id: reportId },
      relations: { media: true },
    });

    if (!report) {
      this.logger.warn(`Report ${reportId} not found for AI processing`);
      return;
    }

    let failedSteps = 0;

    try {
      await this.classify(report);
    } catch (error) {
      failedSteps++;
      this.logger.error(
        `[AI] report=${report.id} step=classify status=error msg=${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    try {
      await this.scoreCredibility(report);
    } catch (error) {
      failedSteps++;
      this.logger.error(
        `[AI] report=${report.id} step=credibility status=error msg=${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    try {
      await this.detectDuplicates(report);
    } catch (error) {
      failedSteps++;
      this.logger.error(
        `[AI] report=${report.id} step=duplicates status=error msg=${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    await this.reportRepository.update(report.id, {
      processedAt: new Date(),
    });

    this.logger.log(
      `[AI] report=${report.id} processed completed with ${failedSteps} failed step(s)`,
    );
  }

  private async retryWithDelay<T>(
    fn: () => Promise<T>,
    operation: string,
    reportId: string,
    retries = 1,
    delayMs = 2000,
  ): Promise<T> {
    let lastError: unknown;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        this.logger.warn(
          `[AI] report=${reportId} step=${operation} attempt=${attempt + 1}/${
            retries + 1
          } failed: ${error instanceof Error ? error.message : String(error)}`,
        );
        if (attempt < retries) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
    }
    throw lastError;
  }

  private async classify(report: Report): Promise<void> {
    const result = await this.retryWithDelay(
      () => this.classificationService.classify(report.description, report.id),
      'classify',
      report.id,
    );
    this.logger.log(
      `[AI] report=${report.id} step=classify status=ok event=${result.eventType} confidence=${result.confidence}`,
    );
  }

  private async scoreCredibility(report: Report): Promise<void> {
    const hasLocation =
      report.latitude != null && report.longitude != null;

    const result = await this.retryWithDelay(
      () =>
        this.credibilityService.score({
          text: report.description,
          source: report.source,
          hasMedia: (report.media?.length ?? 0) > 0,
          hasLocation,
          reportId: report.id,
        }),
      'credibility',
      report.id,
    );
    this.logger.log(
      `[AI] report=${report.id} step=credibility status=ok score=${result.score}`,
    );
  }

  private async detectDuplicates(report: Report): Promise<void> {
    const result = await this.retryWithDelay(
      () =>
        this.duplicatesService.detect({
          text: report.description,
          reportId: report.id,
        }),
      'duplicates',
      report.id,
    );
    this.logger.log(
      `[AI] report=${report.id} step=duplicates status=ok isDuplicate=${result.isDuplicate} score=${result.similarityScore}`,
    );
  }
}