import { Module } from '@nestjs/common';
import { AlertsModule } from '../alerts/alerts.module';
import { MlModule } from '../ml/ml.module';
import { SnapshotIngestionService } from './ingestion.service';

@Module({
  imports: [MlModule, AlertsModule],
  providers: [SnapshotIngestionService],
  exports: [SnapshotIngestionService],
})
export class IngestionModule {}