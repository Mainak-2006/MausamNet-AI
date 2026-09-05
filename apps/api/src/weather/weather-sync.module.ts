import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WeatherModule } from './weather.module';
import { WeatherSyncService } from './weather-sync.service';
import { WeatherSyncController } from './weather-sync.controller';
import { ReportsModule } from '../reports/reports.module';
import { Report } from '../entities/report.entity';
import { User } from '../entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Report, User]),
    WeatherModule,
    ReportsModule,
  ],
  controllers: [WeatherSyncController],
  providers: [WeatherSyncService],
  exports: [WeatherSyncService],
})
export class WeatherSyncModule {}