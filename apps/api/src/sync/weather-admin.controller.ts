import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, Max, Min } from 'class-validator';
import { Role, SyncTriggerType } from '@prisma/client';
import { CurrentUser } from '../auth/current-user.decorator';
import { Roles } from '../auth/roles.decorator';
import { AuthedUser } from '../auth/types';
import { SnapshotIngestionService } from '../ingestion/ingestion.service';
import { WeatherService } from '../weather/weather.service';
import { SyncService, SyncScope } from './sync.service';

export class TriggerSyncDto {
  @IsOptional()
  @IsIn(['all', 'districts', 'cities'])
  scope?: SyncScope = 'all';
}

export class RunsQueryDto {
  @IsOptional()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}

@ApiTags('admin')
@ApiBearerAuth()
@Controller('admin/weather')
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
export class WeatherAdminController {
  constructor(
    private readonly sync: SyncService,
    private readonly weather: WeatherService,
    private readonly ingestion: SnapshotIngestionService,
  ) {}

  @Get('sync')
  status() {
    return this.sync.status();
  }

  @Post('sync')
  @ApiBody({ type: TriggerSyncDto })
  async trigger(
    @CurrentUser() user: AuthedUser,
    @Body() dto: TriggerSyncDto,
  ) {
    return this.sync.startRun(
      SyncTriggerType.MANUAL,
      dto.scope ?? 'all',
      user?.email ?? undefined,
    );
  }

  @Post('sync/cancel')
  cancel() {
    return this.sync.cancel();
  }

  @Get('sync/runs')
  runs(@Query() query: RunsQueryDto) {
    return this.sync.latestRuns(query.limit ?? 10);
  }

  @Get('providers')
  providers() {
    return this.weather.providersStatus();
  }

  @Post('backfill-reports')
  async backfillReports() {
    return this.ingestion.backfillLatest();
  }

  @Post('report-sync/start')
  startReportSync() {
    this.ingestion.start();
    return { started: true, message: 'Report ingestion started' };
  }

  @Post('report-sync/stop')
  stopReportSync() {
    this.ingestion.stop();
    return { stopped: true, message: 'Report ingestion stopped' };
  }

  @Get('report-sync/status')
  reportSyncStatus() {
    return {
      enabled: this.ingestion.isEnabled,
      stats: this.ingestion.stats,
    };
  }
}