import { Injectable, Logger } from '@nestjs/common';
import {
  SyncRun,
  SyncRunStatus,
  SyncTriggerType,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SnapshotIngestionService } from '../ingestion/ingestion.service';

@Injectable()
export class SyncRunsService {
  private readonly logger = new Logger(SyncRunsService.name);

  constructor(private readonly prisma: PrismaService, private readonly ingestion: SnapshotIngestionService) {}

  createRun(
    trigger: SyncTriggerType,
    scope: 'all' | 'districts' | 'cities',
    triggeredBy?: string,
  ): Promise<SyncRun> {
    return this.prisma.syncRun.create({
      data: {
        trigger,
        scope,
        status: SyncRunStatus.QUEUED,
        triggeredBy,
        meta: { remaining: 0 },
      },
    });
  }

  activeRun(scope?: 'all' | 'districts' | 'cities'): Promise<SyncRun | null> {
    return this.prisma.syncRun.findFirst({
      where: {
        status: { in: [SyncRunStatus.QUEUED, SyncRunStatus.RUNNING] },
        ...(scope ? { scope } : {}),
      },
      orderBy: { startedAt: 'desc' },
    });
  }

  /**
   * Immediately fail every queued/running run. Used to "kill" a weather sync:
   * the run stops blocking future syncs, and the worker drops the remaining
   * Kafka jobs because the run is no longer RUNNING.
   */
  async cancelActive(): Promise<number> {
    const active = await this.prisma.syncRun.findMany({
      where: {
        status: { in: [SyncRunStatus.QUEUED, SyncRunStatus.RUNNING] },
      },
      select: { id: true, trigger: true },
    });
    for (const run of active) {
      await this.prisma.syncRun.update({
        where: { id: run.id },
        data: {
          status: SyncRunStatus.FAILED,
          error: 'MANUAL_ABORT',
          finishedAt: new Date(),
        },
      });
    }
    if (active.length > 0) {
      this.logger.warn(`Manually aborted ${active.length} active sync run(s)`);
    }
    return active.length;
  }

  /**
   * Fail any queued/running runs that have been active longer than
   * `staleAfterMs`. A worker that crashes, stalls, or (as happened with the
   * Kafka consumer race) never picks up its jobs would otherwise leave a run
   * RUNNING forever and block every future sync.
   */
  async resolveStale(staleAfterMs: number): Promise<number> {
    const cutoff = new Date(Date.now() - staleAfterMs);
    const staleRuns = await this.prisma.syncRun.findMany({
      where: {
        status: { in: [SyncRunStatus.QUEUED, SyncRunStatus.RUNNING] },
        startedAt: { lt: cutoff },
      },
      select: { id: true, trigger: true, startedAt: true },
    });
    for (const run of staleRuns) {
      await this.prisma.syncRun.update({
        where: { id: run.id },
        data: {
          status: SyncRunStatus.FAILED,
          error: 'STALE_RUN_TIMEOUT',
          finishedAt: new Date(),
        },
      });
    }
    if (staleRuns.length > 0) {
      this.logger.warn(
        `Auto-failed ${staleRuns.length} stale sync run(s) (active > ${Math.round(staleAfterMs / 60_000)} min)`,
      );
    }
    return staleRuns.length;
  }

  async prepare(runId: string, locationsCount: number): Promise<void> {
    await this.prisma.syncRun.update({
      where: { id: runId },
      data: {
        status: SyncRunStatus.RUNNING,
        total: locationsCount,
        meta: { queued: locationsCount },
      },
    });
  }

  async recordSuccess(runId: string): Promise<void> {
    await this.prisma.syncRun
      .update({
        where: { id: runId },
        data: { succeeded: { increment: 1 } },
        select: { id: true, total: true, succeeded: true, failed: true, skipped: true, status: true },
      })
      .then((run) => run && this.maybeFinish(run))
      .catch((err) => this.logger.error(`recordSuccess failed: ${String(err)}`));
  }

  async recordFailure(runId: string, error?: string): Promise<void> {
    await this.prisma.syncRun
      .update({
        where: { id: runId },
        data: { failed: { increment: 1 }, error },
        select: { id: true, total: true, succeeded: true, failed: true, skipped: true, status: true },
      })
      .then((run) => run && this.maybeFinish(run))
      .catch((err) => this.logger.error(`recordFailure failed: ${String(err)}`));
  }

  async markSkipped(runId: string): Promise<void> {
    await this.prisma.syncRun
      .update({
        where: { id: runId },
        data: { skipped: { increment: 1 } },
        select: { id: true, total: true, succeeded: true, failed: true, skipped: true, status: true },
      })
      .then((run) => run && this.maybeFinish(run))
      .catch((err) => this.logger.error(`markSkipped failed: ${String(err)}`));
  }

  private async maybeFinish(run: {
    id: string;
    total: number;
    succeeded: number;
    failed: number;
    skipped: number;
    status: SyncRunStatus;
  }  ): Promise<void> {
    if (run.status !== SyncRunStatus.RUNNING) return;
    const done = run.succeeded + run.failed + run.skipped;
    if (done < run.total) return;

    const status =
      run.failed > 0 ? SyncRunStatus.PARTIAL : SyncRunStatus.COMPLETED;
    const stats = this.ingestion.stats;
    await this.prisma.syncRun.update({
      where: { id: run.id },
      data: { status, finishedAt: new Date(), meta: { reportsGenerated: stats.totalGenerated, reportsSkipped: stats.totalSkipped } },
    });
    this.logger.log(
      `Sync run ${run.id} finished (${status}): ${run.succeeded} ok, ${run.failed} failed, ${run.skipped} skipped, ${stats.totalGenerated} reports generated`,
    );
  }

  async failRun(runId: string, error: string): Promise<void> {
    const run = await this.prisma.syncRun
      .update({
        where: { id: runId },
        data: { status: SyncRunStatus.FAILED, error, finishedAt: new Date() },
      })
      .catch(() => null);
    if (run) this.logger.error(`Sync run ${runId} failed: ${error}`);
  }

  latestRuns(limit = 10): Promise<SyncRun[]> {
    return this.prisma.syncRun.findMany({
      orderBy: { startedAt: 'desc' },
      take: limit,
    });
  }
}