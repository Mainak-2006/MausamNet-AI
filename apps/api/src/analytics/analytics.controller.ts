import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/public.decorator';
import { AnalyticsService } from './analytics.service';

@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Public()
  @Get('overview')
  overview() {
    return this.analytics.overview();
  }

  @Public()
  @Get('events')
  events() {
    return this.analytics.events();
  }

  @Public()
  @Get('regions')
  regions() {
    return this.analytics.regions();
  }

  @Public()
  @Get('timeline/:days')
  timeline(@Param('days', new ParseIntPipe({ errorHttpStatusCode: 400 })) days: number) {
    return this.analytics.timeline(days);
  }

  @Public()
  @Get('timeline')
  timelineDefault() {
    return this.analytics.timeline(7);
  }
}