import 'reflect-metadata';
import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import * as path from 'node:path';
import { ReportStatus, Severity, SourceType } from '@prisma/client';
import { AlertsService } from '../src/alerts/alerts.service';
import { MlService } from '../src/ml/ml.service';
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
  providers: [PrismaService, MlService, AlertsService],
})
class BackfillAlertsModule {}

const logger = new Logger('BackfillAlerts');

async function main() {
  const app = await NestFactory.createApplicationContext(BackfillAlertsModule);
  const alerts = app.get(AlertsService);
  const ml = app.get(MlService);
  const prisma = app.get(PrismaService);

  const candidates = await prisma.report.findMany({
    where: {
      status: { in: [ReportStatus.PENDING, ReportStatus.VERIFIED] },
      severity: { in: [Severity.HIGH, Severity.SEVERE, Severity.CRITICAL] },
      OR: [{ city: { not: null } }, { state: { not: null } }],
    },
    orderBy: { reportedAt: 'asc' },
  });

  logger.log(`Found ${candidates.length} candidate report(s)`);

  let alertsCreated = 0;
  let verified = 0;
  let rescored = 0;
  let skipped = 0;

  for (const report of candidates) {
    // Reports ingested before the source-trust factor was introduced carry a
    // stale, artificially low credibility score. Recompute it so historical
    // severe weather reports are treated consistently with new ingestions.
    if (report.source !== SourceType.CITIZEN) {
      const trust = ml.assessTrust({
        aiConfidence: report.aiConfidence,
        latitude: report.latitude,
        longitude: report.longitude,
        mediaCount: 0,
        city: report.city ?? undefined,
        state: report.state ?? undefined,
        isDuplicate: report.isDuplicate,
        userCredibility: 50,
        source: report.source,
      });
      if (trust.score !== report.credibilityScore) {
        await prisma.report.update({
          where: { id: report.id },
          data: { credibilityScore: trust.score },
        });
        report.credibilityScore = trust.score;
        rescored++;
      }
    }

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
    `Done: ${alertsCreated} alert(s) created, ${verified} report(s) auto-verified, ${rescored} report(s) rescored, ${skipped} skipped`,
  );

  await app.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
