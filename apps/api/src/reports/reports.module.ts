import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { ReportProcessingService } from './report-processing.service';
import { ClassificationModule } from '../classification/classification.module';
import { CredibilityModule } from '../credibility/credibility.module';
import { DuplicatesModule } from '../duplicates/duplicates.module';
import { Report } from '../entities/report.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Report]),
    ClassificationModule,
    CredibilityModule,
    DuplicatesModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsService, ReportProcessingService],
  exports: [ReportsService, ReportProcessingService],
})
export class ReportsModule {}