import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Request,
} from '@nestjs/common';
import { VerificationService } from './verification.service';
import { CreateVerificationDto } from './dto/verify-report.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@mausamnet/shared';

@Controller('verification')
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  async verify(@Body() dto: CreateVerificationDto, @Request() req) {
    return this.verificationService.verify(dto, req.user.id);
  }

  @Get('report/:reportId')
  async findByReport(@Param('reportId', ParseUUIDPipe) reportId: string) {
    return this.verificationService.findByReportId(reportId);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  async findAll() {
    return this.verificationService.findAll();
  }
}