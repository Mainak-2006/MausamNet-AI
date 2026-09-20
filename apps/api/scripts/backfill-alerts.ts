import 'reflect-metadata';
import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import * as path from 'node:path';
import { ReportStatus, Severity } from '@prisma/client';
import { AlertsService } from '../src/alerts/alerts.service';
import { PrismaService } from '../src/prisma/prisma.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        path.resolve(process.cwd(), '.env'),
        path.resolve(process.cwd(), '../../.env'),
      ],
    }),
  ],
  providers: [PrismaService, AlertsService],
})
class BackfillAlertsModule {}

const logger = new Logger('BackfillAlerts');

async function main() {
  const app = await NestFactory.createApplicationContext(BackfillAlertsModule);
  const alerts = app.get(AlertsService);
  const prisma = app.get(PrismaService);

  const candidates = await prisma.report.findMany({
    where: {
      status: { in: [ReportStatus.PENDING, ReportStatus.VERIFIED] },
      severity: { in: [Severity.HIGH, Severity.SEVERE, Severity.CRITICAL] },
      credibilityScore: { gte: 60 },
      OR: [{ city: { not: null } }, { state: { not: null } }],
    },
    orderBy: { reportedAt: 'asc' },
  });

  logger.log(`Found ${candidates.length} candidate report(s)`);

  let alertsCreated = 0;
  let verified = 0;
  let skipped = 0;

  for (const report of candidates) {
    const alert = await alerts.createFromVerifiedReport(report);
    if (!alert) {
      skipped++;
      continue;
    }
    alertsCreated++;
    if (report.status === ReportStatus.PENDING) {
      await prisma.report.update({
        where: { id: report.id },
        data: { status: ReportStatus.VERIFIED, verifiedAt: new Date() },
      });
      verified++;
    }
  }

  logger.log(
    `Done: ${alertsCreated} alert(s) created, ${verified} report(s) auto-verified, ${skipped} skipped`,
  );

  await app.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});