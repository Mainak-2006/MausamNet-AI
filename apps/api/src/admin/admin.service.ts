import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ReportStatus, Role } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { AuthedUser } from '../auth/types';
import { PrismaService } from '../prisma/prisma.service';
import { ReportsService } from '../reports/reports.service';
import { QueryReportsDto } from '../reports/dto/query-reports.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reports: ReportsService,
    private readonly audit: AuditService,
  ) {}

  listReports(query: QueryReportsDto) {
    return this.reports.list(query, true);
  }

  reviewReport(user: AuthedUser, id: string, status: ReportStatus, notes?: string, ip?: string) {
    return this.reports.updateStatus(user, id, status, notes, ip);
  }

  async listAlerts() {
    return this.prisma.alert.findMany({
      orderBy: { startAt: 'desc' },
      include: {
        createdBy: { select: { id: true, name: true } },
      },
    });
  }

  async listUsers(q?: string, page = 1, limit = 20) {
    const where: Prisma.ProfileWhereInput = {};
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { city: { contains: q, mode: 'insensitive' } },
        { username: { contains: q, mode: 'insensitive' } },
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.profile.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          username: true,
          avatarUrl: true,
          city: true,
          state: true,
          role: true,
          suspended: true,
          banned: true,
          credibilityScore: true,
          createdAt: true,
          _count: { select: { reports: true } },
        },
      }),
      this.prisma.profile.count({ where }),
    ]);
    return {
      data,
      meta: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async setRole(actor: AuthedUser, targetId: string, role: Role, ip?: string) {
    const target = await this.prisma.profile.findUnique({
      where: { id: targetId },
    });
    if (!target) throw new NotFoundException('User not found');
    if (role === Role.SUPER_ADMIN && actor.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('Only SUPER_ADMIN can grant SUPER_ADMIN');
    }
    await this.prisma.profile.update({ where: { id: targetId }, data: { role } });
    await this.audit.record(
      actor.id,
      'user.role.change',
      'Profile',
      targetId,
      { from: target.role, to: role },
      ip,
    );
    return { ok: true, role };
  }

  async setStatus(
    actor: AuthedUser,
    targetId: string,
    status: 'suspend' | 'ban' | 'reactivate',
    ip?: string,
  ) {
    const target = await this.prisma.profile.findUnique({
      where: { id: targetId },
    });
    if (!target) throw new NotFoundException('User not found');

    let data: { suspended?: boolean; banned?: boolean } = {};
    if (status === 'suspend') data = { suspended: true };
    else if (status === 'ban') data = { suspended: true, banned: true };
    else data = { suspended: false, banned: false };

    await this.prisma.profile.update({ where: { id: targetId }, data });
    await this.audit.record(actor.id, `user.${status}`, 'Profile', targetId, {}, ip);
    return { ok: true, status };
  }

  async auditLogs(page = 1, limit = 20) {
    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { actor: { select: { id: true, name: true, email: true } } },
      }),
      this.prisma.auditLog.count(),
    ]);
    return {
      data,
      meta: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }
}