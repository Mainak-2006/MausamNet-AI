import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  EventCategory,
  Report,
  ReportStatus,
  SourceType,
} from '@prisma/client';
import { AlertsService } from '../alerts/alerts.service';
import { AuditService } from '../audit/audit.service';
import { MlService } from '../ml/ml.service';
import { PrismaService } from '../prisma/prisma.service';

export interface SnapshotReportInput {
  city: string;
  state?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  temperature?: number | null;
  feelsLike?: number | null;
  humidity?: number | null;
  pressure?: number | null;
  windSpeed?: number | null;
  windDirection?: number | null;
  condition?: string | null;
  source: SourceType;
  observedAt: Date;
}

interface ConditionRule {
  pattern: RegExp;
  category: EventCategory;
}

/**
 * First-match-wins condition -> event mapping. Order matters: specific/severe
 * events (cyclone, flood, thunder) must beat generic ones (rain, fog).
 */
const CONDITION_RULES: ConditionRule[] = [
  { pattern: /(flash ?flood|cloudburst)/, category: EventCategory.FLASH_FLOOD },
  { pattern: /(cyclone|typhoon|hurricane|tropical storm)/, category: EventCategory.CYCLONE },
  { pattern: /(flood|inundat|submerg|waterlog)/, category: EventCategory.FLOOD },
  { pattern: /(thunder|lightning|electrical storm)/, category: EventCategory.THUNDERSTORM },
  { pattern: /(hail|hailstorm)/, category: EventCategory.HAILSTORM },
  { pattern: /(dust storm|sandstorm)/, category: EventCategory.DUST_STORM },
  { pattern: /(heavy rain|torrential|downpour|drenching|very heavy|extremely heavy)/, category: EventCategory.HEAVY_RAINFALL },
  { pattern: /(gale|squall|strong winds?|high winds?|windy)/, category: EventCategory.STRONG_WIND },
  { pattern: /(dense fog)/, category: EventCategory.DENSE_FOG },
  { pattern: /(freezing fog|fog|mist|haze)/, category: EventCategory.FOG },
  { pattern: /(blizzard|snow ?fall|snow|sleet)/, category: EventCategory.SNOWFALL },
  { pattern: /(rain|drizzle|shower|rainfall)/, category: EventCategory.RAINFALL },
  { pattern: /(heat ?wave|very hot|extremely hot|hot)/, category: EventCategory.HEATWAVE },
  { pattern: /(cold ?wave|freezing|extremely cold|very cold)/, category: EventCategory.COLD_WAVE },
  { pattern: /(drought|dry spell)/, category: EventCategory.DROUGHT },
  { pattern: /(landslide|land slip|mudslide)/, category: EventCategory.LANDSLIDE },
];

const SOURCE_LABEL: Record<SourceType, string> = {
  [SourceType.CITIZEN]: 'citizen',
  [SourceType.IMD]: 'IMD',
  [SourceType.OPENWEATHER]: 'OpenWeather',
  [SourceType.WEATHERAPI]: 'WeatherAPI',
  [SourceType.NEWS]: 'news',
  [SourceType.INTERNET]: 'internet',
  [SourceType.IOT]: 'IoT sensor',
};

@Injectable()
export class SnapshotIngestionService {
  private readonly logger = new Logger(SnapshotIngestionService.name);
  private enabled: boolean;
  private totalGenerated = 0;
  private totalSkipped = 0;

  constructor(
    private readonly prisma: PrismaService,
    private readonly ml: MlService,
    private readonly config: ConfigService,
    private readonly alerts: AlertsService,
    private readonly audit: AuditService,
  ) {
    this.enabled = this.config.get<string>('INGESTION_ENABLED') !== 'false';
  }

  start(): void {
    this.enabled = true;
    this.totalGenerated = 0;
    this.totalSkipped = 0;
    this.logger.log('Report ingestion started');
  }

  resetCounters(): void {
    this.totalGenerated = 0;
    this.totalSkipped = 0;
  }

  stop(): void {
    this.enabled = false;
    this.logger.log('Report ingestion stopped');
  }

  get isEnabled(): boolean {
    return this.enabled;
  }

  get stats(): { totalGenerated: number; totalSkipped: number } {
    return {
      totalGenerated: this.totalGenerated,
      totalSkipped: this.totalSkipped,
    };
  }

  /**
   * Convert a synced weather snapshot into a weather Report. Returns null when
   * the condition is benign (clear sky, clouds, …) or the event was already
   * reported for the same place within the dedupe window.
   */
  async ingest(input: SnapshotReportInput): Promise<Report | null> {
    if (!this.enabled) {
      this.logger.debug(`Ingestion disabled, skipping: ${input.city}`);
      return null;
    }
    const condition = input.condition?.trim();
    const category = this.classifyCondition(condition);
    if (!category) {
      this.logger.debug(
        `Snap ingestion skip (benign): ${input.city} ${condition ?? '(no condition)'}`,
      );
      return null;
    }

    const title = this.buildTitle(condition, input.city);
    const description = this.buildDescription(input);
    const prediction = await this.ml.classify(title);
    const aiCategory = this.ml.normalizeCategory(prediction.category) ?? category;
    const aiConfidence = prediction.confidence;

    const duplicates = await this.ml.findDuplicates({
      category: aiCategory,
      text: title,
      city: input.city,
      latitude: input.latitude,
      longitude: input.longitude,
    });
    if (duplicates.isDuplicate) {
      this.logger.log(
        `Snap ingestion skip (duplicate): ${input.city} ${condition} -> ${aiCategory}`,
      );
      return null;
    }

    const trust = this.ml.assessTrust({
      aiConfidence,
      aiMethod: prediction.method,
      latitude: input.latitude,
      longitude: input.longitude,
      mediaCount: 0,
      city: input.city,
      state: input.state ?? undefined,
      isDuplicate: false,
      userCredibility: 50,
    });

    const severity = this.ml.inferSeverity(aiCategory, aiConfidence);

    const report = await this.prisma.report.create({
      data: {
        title,
        description,
        category: aiCategory,
        severity,
        status: ReportStatus.PENDING,
        city: input.city,
        state: input.state,
        latitude: input.latitude,
        longitude: input.longitude,
        source: input.source,
        aiPrediction: aiCategory,
        aiConfidence,
        credibilityScore: trust.score,
        isDuplicate: false,
        reportedAt: input.observedAt,
      },
    });

    this.logger.log(
      `Ingested weather report "${title}" (${aiCategory}, source ${input.source}, city ${input.city})`,
    );
    this.totalGenerated++;

    await this.autoVerifyAndPublish(report);

    return report;
  }

  /**
   * Skips the human verification step for high-severity, high-credibility
   * reports: the report is marked VERIFIED and an alert is published
   * automatically.
   */
  private async autoVerifyAndPublish(report: Report): Promise<void> {
    if (!(await this.alerts.canAutoPublish(report))) {
      return;
    }
    await this.prisma.report.update({
      where: { id: report.id },
      data: { status: ReportStatus.VERIFIED, verifiedAt: new Date() },
    });
    const autoAlert = await this.alerts.createFromVerifiedReport(report);
    if (autoAlert) {
      this.logger.log(
        `Auto-verified report ${report.id} and published alert ${autoAlert.id}`,
      );
      await this.audit.record(
        undefined,
        'report.auto_verified',
        'Report',
        report.id,
        { autoAlert: true },
      );
      await this.audit.record(
        undefined,
        'alert.auto_create',
        'Alert',
        autoAlert.id,
        { reportId: report.id },
      );
    }
  }

  /** Ingest the latest snapshot per location already stored in Postgres. */
  async backfillLatest(): Promise<{ generated: number; skipped: number }> {
    if (!this.enabled) {
      this.logger.warn('Cannot backfill: ingestion is not enabled');
      return { generated: 0, skipped: 0 };
    }
    this.resetCounters();
    const snapshots = await this.prisma.weatherSnapshot.findMany({
      orderBy: { observedAt: 'desc' },
      take: 5000,
    });
    const latest = new Map<string, typeof snapshots[0]>();
    for (const snap of snapshots) {
      const key = snap.locationId ?? snap.city;
      if (key && !latest.has(key)) latest.set(key, snap);
    }

    let generated = 0;
    let skipped = 0;
    for (const snap of latest.values()) {
      if (!this.enabled) {
        this.logger.warn('Ingestion stopped during backfill');
        break;
      }
      const result = await this.ingest({
        city: snap.city,
        state: snap.state,
        latitude: snap.latitude,
        longitude: snap.longitude,
        temperature: snap.temperature,
        feelsLike: snap.feelsLike,
        humidity: snap.humidity,
        pressure: snap.pressure,
        windSpeed: snap.windSpeed,
        windDirection: snap.windDirection,
        condition: snap.condition,
        source: snap.source,
        observedAt: snap.observedAt,
      });
      if (result) generated++;
      else { skipped++; this.totalSkipped++; }
    }
    this.logger.log(
      `Snapshot backfill done: ${generated} reports generated, ${skipped} skipped`,
    );
    return { generated, skipped };
  }

  classifyCondition(condition?: string | null): EventCategory | null {
    const text = condition?.toLowerCase() ?? '';
    if (!text) return null;
    for (const rule of CONDITION_RULES) {
      if (rule.pattern.test(text)) return rule.category;
    }
    return null;
  }

  private buildTitle(condition: string | null | undefined, city: string): string {
    const label = condition?.trim() ? this.capitalize(condition.trim()) : 'Weather event';
    return `${label} reported in ${city}`;
  }

  private buildDescription(input: SnapshotReportInput): string {
    const sourceLabel = SOURCE_LABEL[input.source] ?? input.source;
    const place = [input.city, input.state].filter(Boolean).join(', ');
    const parts = [
      `Automated ${sourceLabel} weather observation for ${place}.`,
    ];
    if (input.temperature != null) {
      parts.push(`Temperature ${input.temperature}°C${
        input.feelsLike != null ? ` (feels like ${input.feelsLike}°C)` : ''
      }.`);
    }
    if (input.humidity != null) parts.push(`Humidity ${input.humidity}%.`);
    if (input.windSpeed != null) {
      parts.push(
        `Wind ${input.windSpeed} km/h${
          input.windDirection != null ? ` (${input.windDirection}°)` : ''
        }.`,
      );
    }
    if (input.pressure != null) parts.push(`Pressure ${input.pressure} mb.`);
    parts.push(`Observed ${input.observedAt.toISOString()}.`);
    return parts.join(' ');
  }

  private capitalize(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
}