import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { CreateAlertDto } from './dto/create-alert.dto';
import { UpdateAlertDto } from './dto/update-alert.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@mausamnet/shared';

@Controller('alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get()
  async findActive() {
    return this.alertsService.findActive();
  }

  @Get('report/:reportId')
  async findByReport(@Param('reportId', ParseUUIDPipe) reportId: string) {
    return this.alertsService.findByReportId(reportId);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  async create(@Body() dto: CreateAlertDto) {
    return this.alertsService.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  async setActive(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAlertDto,
  ) {
    return this.alertsService.setActive(id, dto.isActive ?? true);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.alertsService.remove(id);
  }
}