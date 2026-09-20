import { Injectable, Logger } from '@nestjs/common';
import { SourceType, SyncRunStatus } from '@prisma/client';
import { SnapshotIngestionService } from '../ingestion/ingestion.service';
import { PrismaService } from '../prisma/prisma.service';
import { WeatherService } from '../weather/weather.service';
import { KafkaService } from './kafka.service';
import { SyncRunsService } from './sync-runs.service';
import { RegistryLocation } from './location-registry.service';

export interface SyncJob {
  runId: string;
  location: RegistryLocation;
}

export interface SnapshotEvent {
  locationId: string;
  name: string;
  state: string;
  type: string;
  latitude: number | null;
  longitude: number | null;
  temperature?: number;
  feelsLike?: number;
  humidity?: number;
  pressure?: number;
  windSpeed?: number;
  windDirection?: number;
  condition?: string;
  source: SourceType;
  provider?: string;
  observedAt: string;
  runId?: string;
}

@Injectable()
export class SyncWorker {
  private readonly logger = new Logger(SyncWorker.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly weather: WeatherService,
    private readonly kafka: KafkaService,
    private readonly runs: SyncRunsService,
    private readonly ingestion: SnapshotIngestionService,
  ) {}

  /** Fetch current weather for a location, persist a snapshot and emit the event. */
  async processJob(job: SyncJob): Promise<void> {
    const { runId, location } = job;

    const run = await this.prisma.syncRun.findUnique({
      where: { id: runId },
      select: { status: true },
    });
    if (!run || run.status !== SyncRunStatus.RUNNING) {
      await this.runs.recordFailure(
        runId,
        `run ${run ? run.status : 'NOT_FOUND'} — job discarded`,
      );
      return;
    }

    if (location.latitude == null || location.longitude == null) {
      await this.runs.markSkipped(runId);
      return;
    }

    try {
      const data = await this.weather.getCurrent({
        lat: location.latitude,
        lon: location.longitude,
      });

      const source = data.source as SourceType;
      const snapshot = await this.prisma.weatherSnapshot.create({
        data: {
          city: data.city || location.name,
          state: data.state ?? location.state,
          latitude: data.latitude ?? location.latitude,
          longitude: data.longitude ?? location.longitude,
          temperature: data.temperature,
          feelsLike: data.feelsLike,
          humidity: data.humidity,
          pressure: data.pressure,
          windSpeed: data.windSpeed,
          windDirection: data.windDirection,
          condition: data.condition,
          source,
          observedAt: data.observedAt,
          locationId: location.id,
          runId,
        },
      });

      await this.prisma.syncLocation.update({
        where: { id: location.id },
        data: { lastSyncedAt: data.observedAt },
      });

      const event: SnapshotEvent = {
        locationId: location.id,
        name: location.name,
        state: location.state,
        type: location.type,
        latitude: snapshot.latitude,
        longitude: snapshot.longitude,
        temperature: snapshot.temperature ?? undefined,
        feelsLike: snapshot.feelsLike ?? undefined,
        humidity: snapshot.humidity ?? undefined,
        pressure: snapshot.pressure ?? undefined,
        windSpeed: snapshot.windSpeed ?? undefined,
        windDirection: snapshot.windDirection ?? undefined,
        condition: snapshot.condition ?? undefined,
        source,
        observedAt: snapshot.observedAt.toISOString(),
        runId,
      };

      await this.kafka
        .publish(this.kafka.getTopic('snapshot'), event, location.id)
        .catch((err) =>
          this.logger.warn(`Snapshot event publish failed: ${String(err)}`),
        );

      await this.ingestion
        .ingest({
          city: snapshot.city,
          state: snapshot.state,
          latitude: snapshot.latitude,
          longitude: snapshot.longitude,
          temperature: snapshot.temperature,
          feelsLike: snapshot.feelsLike,
          humidity: snapshot.humidity,
          pressure: snapshot.pressure,
          windSpeed: snapshot.windSpeed,
          windDirection: snapshot.windDirection,
          condition: snapshot.condition,
          source,
          observedAt: snapshot.observedAt,
        })
        .catch((err) =>
          this.logger.warn(`Snapshot report ingestion failed: ${String(err)}`),
        );

      await this.runs.recordSuccess(runId);
    } catch (err) {
      await this.runs.recordFailure(
        runId,
        `${location.id}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}
