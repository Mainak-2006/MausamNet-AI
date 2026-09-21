import {
  Body,
  BadRequestException,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ReportStatus, Role } from '@prisma/client';
import { Request } from 'express';
import { CurrentUser } from '../auth/current-user.decorator';
import { Roles } from '../auth/roles.decorator';
import { AuthedUser } from '../auth/types';
import { QueryReportsDto } from '../reports/dto/query-reports.dto';
import { AdminService } from './admin.service';
import {
  AdminUsersQueryDto,
  NoteDto,
  UpdateRoleDto,
} from './dto/admin.dto';

@ApiTags('admin')
@ApiBearerAuth()
@Controller('admin')
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('reports')
  listReports(@Query() query: QueryReportsDto) {
    return this.admin.listReports(query);
  }

  @Post('reports/:id/verify')
  verifyReport(
    @CurrentUser() user: AuthedUser,
    @Param('id') id: string,
    @Body() dto: NoteDto,
    @Req() req: Request,
  ) {
    return this.admin.reviewReport(
      user,
      id,
      ReportStatus.VERIFIED,
      dto.notes,
      this.extractIp(req),
    );
  }

  @Post('reports/:id/reject')
  rejectReport(
    @CurrentUser() user: AuthedUser,
    @Param('id') id: string,
    @Body() dto: NoteDto,
    @Req() req: Request,
  ) {
    return this.admin.reviewReport(
      user,
      id,
      ReportStatus.REJECTED,
      dto.notes,
      this.extractIp(req),
    );
  }

  @Post('reports/:id/suspect')
  suspectReport(
    @CurrentUser() user: AuthedUser,
    @Param('id') id: string,
    @Body() dto: NoteDto,
    @Req() req: Request,
  ) {
    return this.admin.reviewReport(
      user,
      id,
      ReportStatus.SUSPICIOUS,
      dto.notes,
      this.extractIp(req),
    );
  }

  @Post('reports/:id/pending')
  pendingReport(
    @CurrentUser() user: AuthedUser,
    @Param('id') id: string,
    @Body() dto: NoteDto,
    @Req() req: Request,
  ) {
    return this.admin.reviewReport(
      user,
      id,
      ReportStatus.PENDING,
      dto.notes,
      this.extractIp(req),
    );
  }

  @Get('users')
  listUsers(@Query() query: AdminUsersQueryDto) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 && query.limit <= 100
      ? query.limit
      : 20;
    return this.admin.listUsers(query.q, query.role, page, limit);
  }

  @Patch('users/:id/role')
  changeRole(
    @CurrentUser() user: AuthedUser,
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
    @Req() req: Request,
  ) {
    if (!dto.role) {
      throw new BadRequestException('Role is required');
    }
    return this.admin.setRole(user, id, dto.role, this.extractIp(req));
  }

  @Post('users/:id/suspend')
  suspend(
    @CurrentUser() user: AuthedUser,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    return this.admin.setStatus(user, id, 'suspend', this.extractIp(req));
  }

  @Post('users/:id/ban')
  ban(
    @CurrentUser() user: AuthedUser,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    return this.admin.setStatus(user, id, 'ban', this.extractIp(req));
  }

  @Post('users/:id/reactivate')
  reactivate(
    @CurrentUser() user: AuthedUser,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    return this.admin.setStatus(user, id, 'reactivate', this.extractIp(req));
  }

  @Get('audit-logs')
  auditLogs() {
    return this.admin.auditLogs(1, 20);
  }

  @Get('alerts')
  listAlerts() {
    return this.admin.listAlerts();
  }

  private extractIp(req: Request): string | undefined {
    return req.ip ?? req.socket?.remoteAddress ?? undefined;
  }
}