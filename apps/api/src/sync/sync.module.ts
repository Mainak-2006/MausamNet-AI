import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { IngestionModule } from '../ingestion/ingestion.module';
import { WeatherModule } from '../weather/weather.module';
import { KafkaService } from './kafka.service';
import { LocationRegistryService } from './location-registry.service';
import { SyncRunsService } from './sync-runs.service';
import { SyncService } from './sync.service';
import { SyncWorker } from './sync.worker';
import { WeatherAdminController } from './weather-admin.controller';

@Module({
  imports: [AuthModule, WeatherModule, IngestionModule],
  controllers: [WeatherAdminController],
  providers: [
    KafkaService,
    LocationRegistryService,
    SyncRunsService,
    SyncWorker,
    SyncService,
  ],
  exports: [SyncService, KafkaService],
})
export class SyncModule {}