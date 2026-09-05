import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlertsService } from './alerts.service';
import { AlertsController } from './alerts.controller';
import { Alert } from '../entities/alert.entity';
import { Report } from '../entities/report.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Alert, Report])],
  controllers: [AlertsController],
  providers: [AlertsService],
  exports: [AlertsService],
})
export class AlertsModule {}