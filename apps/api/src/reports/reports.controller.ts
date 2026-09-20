import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { CurrentUser } from '../auth/current-user.decorator';
import { Public } from '../auth/public.decorator';
import { AuthedUser } from '../auth/types';
import { ReportsService } from './reports.service';
import { CreateReportDto, UpdateReportDto } from './dto/create-report.dto';
import { QueryReportsDto } from './dto/query-reports.dto';

@ApiTags('reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Public()
  @Get()
  list(@Query() query: QueryReportsDto) {
    return this.reports.list(query, false);
  }

  @ApiBearerAuth()
  @Post()
  create(
    @CurrentUser() user: AuthedUser,
    @Body() dto: CreateReportDto,
    @Req() req: Request,
  ) {
    return this.reports.create(user, dto, this.extractIp(req));
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reports.findOne(id);
  }

  @ApiBearerAuth()
  @Patch(':id')
  update(
    @CurrentUser() user: AuthedUser,
    @Param('id') id: string,
    @Body() dto: UpdateReportDto,
    @Req() req: Request,
  ) {
    return this.reports.update(user, id, dto, this.extractIp(req));
  }

  @ApiBearerAuth()
  @Delete(':id')
  remove(
    @CurrentUser() user: AuthedUser,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    return this.reports.remove(user, id, this.extractIp(req));
  }

  private extractIp(req: Request): string | undefined {
    return req.ip ?? req.socket?.remoteAddress ?? undefined;
  }
}