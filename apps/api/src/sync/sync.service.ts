import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SyncTriggerType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SnapshotIngestionService } from '../ingestion/ingestion.service';
import { WeatherService } from '../weather/weather.service';
import { KafkaService } from './kafka.service';
import {
  LocationRegistryService,
  RegistryLocation,
} from './location-registry.service';
import { SyncRunsService } from './sync-runs.service';
import { SyncWorker, SyncJob } from './sync.worker';
import { WeatherSyncStatus } from './status.interface';

export type SyncScope = 'all' | 'districts' | 'cities';

@Injectable()
export class SyncService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SyncService.name);

  private readonly kafkaEnabled: boolean;
  private readonly enabled: boolean;
  private readonly intervalMinutes: number;
  private readonly concurrency: number;
  private readonly runTimeoutMs: number;
  private readonly jobTimeoutMs: number;

  private running = false;
  private watchdogTimer: NodeJS.Timeout | null = null;
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly weather: WeatherService,
    private readonly registry: LocationRegistryService,
    private readonly kafka: KafkaService,
    private readonly runs: SyncRunsService,
    private readonly worker: SyncWorker,
    private readonly ingestion: SnapshotIngestionService,
  ) {
    this.kafkaEnabled = this.config.get<string>('KAFKA_ENABLED') === 'true';
    this.enabled = (this.config.get<string>('WEATHER_SYNC_ENABLED') ?? 'true') !== 'false';
    this.intervalMinutes = Number(
      this.config.get<string>('WEATHER_SYNC_INTERVAL_MINUTES') ?? '60',
    );
    this.concurrency = Number(
      this.config.get<string>('WEATHER_SYNC_CONCURRENCY') ?? '5',
    );
    this.runTimeoutMs =
      Math.max(1, Number(this.config.get<string>('WEATHER_SYNC_RUN_TIMEOUT_MINUTES') ?? '90')) *
      60_000;
    this.jobTimeoutMs = Math.max(
      5_000,
      Number(this.config.get<string>('WEATHER_SYNC_JOB_TIMEOUT_MS') ?? '60000'),
    );
  }

  private nextRunAt: Date | null = null;

  async onModuleInit() {
    if (!this.kafkaEnabled) {
      this.logger.log(
        'SyncService: Kafka disabled — jobs will run in-process (KAFKA_ENABLED=true to switch)',
      );
    } else {
      // Nest invokes onModuleInit hooks concurrently, so KafkaService may not
      // have connected yet. Wait for it before deciding how to consume.
      await this.kafka.whenReady();
      if (this.kafka.isEnabled()) {
        // Start the consumer in the background — do NOT await it, because
        // consumer.run() blocks forever and would prevent the watchdog and
        // scheduled sync from starting.
        this.kafka
          .consume(
            this.kafka.getTopic('sync'),
            'mausamnet-sync-worker',
            async (message) => {
              const job = message as SyncJob;
              if (job?.runId && job?.location) {
                await this.runWithTimeout(job);
              }
            },
          )
          .catch((err) =>
            this.logger.error(`Consumer error: ${String(err)}`),
          );
        this.logger.log('SyncService: waiting for weather jobs on Kafka');
      } else {
        this.logger.warn(
          'SyncService: Kafka claimed enabled but broker unreachable — falling back to in-process',
        );
      }
    }

    await this.runs.resolveStale(this.runTimeoutMs);
    this.startWatchdog();

    if (this.enabled) {
      await this.resumeSchedule();
    }
  }

  /** Restart-safe schedule: resumes the persisted countdown, or starts fresh. */
  private async resumeSchedule(): Promise<void> {
    const now = Date.now();
    const persisted = await this.prisma.syncSchedule.findUnique({
      where: { id: 1 },
    });
    if (persisted && persisted.nextRunAt.getTime() > now) {
      this.nextRunAt = persisted.nextRunAt;
      this.logger.log(
        `Resuming auto-sync schedule (next ~${this.nextRunAt.toISOString()})`,
      );
      await this.scheduleNext(this.nextRunAt.getTime() - now);
      return;
    }
    this.nextRunAt = new Date(now + this.intervalMinutes * 60_000);
    await this.persistNextRunAt();
    this.logger.log(
      `Scheduling auto-sync every ${this.intervalMinutes} minutes (next ~${this.nextRunAt.toISOString()})`,
    );
    await this.scheduleNext();
  }

  private async persistNextRunAt(): Promise<void> {
    if (!this.nextRunAt) return;
    await this.prisma.syncSchedule.upsert({
      where: { id: 1 },
      create: { id: 1, nextRunAt: this.nextRunAt },
      update: { nextRunAt: this.nextRunAt },
    });
  }

  /** Recursive self-scheduling used when Kafka is enabled (jobs are async). */
  private async scheduleNext(delayMs?: number): Promise<void> {
    if (!this.enabled) return;
    const intervalMs = this.intervalMinutes * 60_000;
    const delay = Math.max(0, delayMs ?? intervalMs);
    setTimeout(async () => {
      try {
        await this.startRun(SyncTriggerType.SCHEDULED, 'all');
      } catch (err) {
        this.logger.error(`Scheduled sync failed: ${String(err)}`);
      } finally {
        if (this.enabled) {
          this.nextRunAt = new Date(Date.now() + intervalMs);
          await this.persistNextRunAt();
          await this.scheduleNext();
        }
      }
    }, delay);
  }

  /**
   * Periodically fails runs that outlived their timeout, so a stuck run can
   * never leave the system blocked on SYNC_IN_PROGRESS until someone presses
   * "Sync now" again.
   */
  private startWatchdog(): void {
    const periodMs = Math.max(60_000, Math.round(this.runTimeoutMs / 2));
    this.watchdogTimer = setInterval(async () => {
      try {
        const stale = await this.runs.resolveStale(this.runTimeoutMs);
        if (stale > 0) {
          this.logger.warn(`Watchdog failed ${stale} stale sync run(s)`);
        }
      } catch (err) {
        this.logger.error(`Watchdog failed: ${String(err)}`);
      }
    }, periodMs);
    this.watchdogTimer.unref?.();
  }

  /**
   * Runs a single sync job under a timeout. A job that hangs (e.g. a stuck
   * provider/DB call) would otherwise freeze the Kafka consumer on that
   * partition forever and leave the whole run stuck RUNNING.
   */
  private async runWithTimeout(job: SyncJob): Promise<void> {
    let timer: NodeJS.Timeout | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(
        () =>
          reject(
            new Error(
              `job timed out after ${this.jobTimeoutMs}ms (${job.location.id})`,
            ),
          ),
        this.jobTimeoutMs,
      );
    });
    try {
      await Promise.race([this.worker.processJob(job), timeout]);
    } catch (err) {
      await this.runs.recordFailure(
        job.runId,
        `${job.location.id}: ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      clearTimeout(timer);
    }
  }

  async startRun(
    trigger: SyncTriggerType,
    scope: SyncScope = 'all',
    triggeredBy?: string,
  ): Promise<{ runId: string; locations: number; kafka: boolean }> {
    await this.runs.resolveStale(this.runTimeoutMs);
    const existing = await this.runs.activeRun();
    if (existing) {
      this.logger.warn(
        `Sync skipped: run ${existing.id} (${existing.status}) still active`,
      );
      throw new Error('SYNC_IN_PROGRESS: A weather sync is already running');
    }
    if (this.running) throw new Error('SYNC_IN_PROGRESS: A weather sync is already running');
    this.ingestion.resetCounters();
    this.running = true;

    const locations = this.selectLocations(scope);
    const run = await this.runs.createRun(trigger, scope, triggeredBy);
    try {
      await this.ensureLocationsInDb(locations);
      await this.runs.prepare(run.id, locations.length);

      const useKafka = this.kafkaEnabled && this.kafka.isEnabled();
      if (useKafka) {
        await this.publishJobs(run, locations);
        return { runId: run.id, locations: locations.length, kafka: true };
      }

      await this.runInline(run.id, locations);
      return { runId: run.id, locations: locations.length, kafka: false };
    } catch (err) {
      await this.runs.failRun(run.id, err instanceof Error ? err.message : String(err));
      throw err;
    } finally {
      this.running = false;
    }
  }

  private selectLocations(scope: SyncScope): RegistryLocation[] {
    return this.registry.all().filter((l) => {
      if (scope === 'districts') return l.type === 'DISTRICT';
      if (scope === 'cities') return l.type === 'CITY';
      return true;
    });
  }

  private async ensureLocationsInDb(locations: RegistryLocation[]): Promise<void> {
    const existing = new Set(
      (
        await this.prisma.syncLocation.findMany({
          where: { id: { in: locations.map((l) => l.id) } },
          select: { id: true },
        })
      ).map((r) => r.id),
    );

    const missing = locations.filter((l) => !existing.has(l.id));
    const batchSize = 250;
    for (let i = 0; i < missing.length; i += batchSize) {
      const chunk = missing.slice(i, i + batchSize);
      await this.prisma.syncLocation.createMany({
        data: chunk.map((l) => ({
          id: l.id,
          name: l.name,
          state: l.state,
          type: l.type,
          latitude: l.latitude,
          longitude: l.longitude,
          population: l.population ?? null,
          coordinateSource: 'registry',
        })),
        skipDuplicates: true,
      });
    }
    if (missing.length > 0) {
      this.logger.log(`Upserted ${missing.length} new sync locations`);
    }
  }

  private async publishJobs(run: { id: string }, locations: RegistryLocation[]): Promise<void> {
    const topic = this.kafka.getTopic('sync');
    const batchSize = 100;
    for (let i = 0; i < locations.length; i += batchSize) {
      const chunk = locations.slice(i, i + batchSize);
      await Promise.all(
        chunk.map((location) =>
          this.kafka.publish(topic, { runId: run.id, location } satisfies SyncJob, location.id),
        ),
      );
    }
    this.logger.log(
      `Published ${locations.length} sync jobs for run ${run.id} to ${topic}`,
    );
  }

  /** In-process fallback when Kafka is disabled/unavailable. */
  private async runInline(runId: string, locations: RegistryLocation[]): Promise<void> {
    let cursor = 0;
    const workers = Array.from(
      { length: Math.max(1, Math.min(this.concurrency, locations.length)) },
      async () => {
        while (true) {
          const next = cursor++;
          if (next >= locations.length) return;
          const location = locations[next];
          await this.worker.processJob({ runId, location });
        }
      },
    );
    await Promise.all(workers);
  }

  /** Immediately abort any in-progress run and drop its remaining Kafka jobs. */
  async cancel(): Promise<{ cancelled: number }> {
    const cancelled = await this.runs.cancelActive();
    if (cancelled > 0) {
      this.logger.warn(`Weather sync killed: ${cancelled} run(s) aborted`);
    }
    return { cancelled };
  }

  async status(): Promise<WeatherSyncStatus> {
    const activeRun = await this.runs.activeRun();
    const providerStatus = await this.weather.providersStatus();
    const ingestionStats = this.ingestion.stats;
    const schedule = await this.prisma.syncSchedule.findUnique({
      where: { id: 1 },
    });
    return {
      syncEnabled: this.enabled,
      kafka: {
        enabled: this.config.get<string>('KAFKA_ENABLED') === 'true',
        connected: this.kafka.isEnabled(),
        brokers: (this.config.get<string>('KAFKA_BROKERS') ?? 'localhost:9092').split(','),
      },
      schedule: {
        enabled: this.enabled,
        intervalMinutes: this.intervalMinutes,
        nextRunAt: schedule?.nextRunAt ?? this.nextRunAt,
      },
      providers: providerStatus,
      locations: this.registry.count(),
      activeRun,
      lastRun: (await this.runs.latestRuns(1))[0] ?? null,
      reportSync: {
        enabled: this.ingestion.isEnabled,
        totalGenerated: ingestionStats.totalGenerated,
        totalSkipped: ingestionStats.totalSkipped,
      },
    };
  }

  async latestRuns(limit = 10): Promise<{ id: string; trigger: string; status: string; scope: string; total: number; succeeded: number; failed: number; skipped: number; startedAt: Date; finishedAt: Date | null; triggeredBy: string | null; reportsGenerated: number; reportsSkipped: number }[]> {
    const runs = await this.runs.latestRuns(limit);
    return runs.map((r) => ({
      id: r.id,
      trigger: r.trigger,
      status: r.status,
      scope: r.scope,
      total: r.total,
      succeeded: r.succeeded,
      failed: r.failed,
      skipped: r.skipped,
      startedAt: r.startedAt,
      finishedAt: r.finishedAt,
      triggeredBy: r.triggeredBy,
      reportsGenerated: (r.meta as Record<string, number>)?.reportsGenerated ?? 0,
      reportsSkipped: (r.meta as Record<string, number>)?.reportsSkipped ?? 0,
    }));
  }

  async onModuleDestroy() {
    if (this.watchdogTimer) {
      clearInterval(this.watchdogTimer);
      this.watchdogTimer = null;
    }
  }
}