import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async record(
    actorId: string | undefined,
    action: string,
    targetType: string | undefined | null,
    targetId: string | undefined | null,
    meta?: Prisma.InputJsonValue,
    ip?: string,
  ) {
    return this.prisma.auditLog.create({
      data: {
        actorId: actorId ?? undefined,
        action,
        targetType: targetType ?? undefined,
        targetId: targetId ?? undefined,
        meta: meta ?? undefined,
        ip,
      },
    });
  }
}