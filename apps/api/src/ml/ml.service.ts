import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  EventCategory,
  ReportStatus,
  Severity,
  SourceType,
} from '@prisma/client';
import { MlMethod, MlPrediction } from '../auth/types';
import {
  baseSeverityForCategory,
  clamp,
  haversineDistanceKm,
  jaccardSimilarity,
  SEVERITIES,
} from '../common/constants';
import { PrismaService } from '../prisma/prisma.service';

const DUPLICATE_TEXT_THRESHOLD = 0.35;
const DUPLICATE_WINDOW_MS = 6 * 60 * 60 * 1000;
const DUPLICATE_RADIUS_KM = 10;
const DUPLICATE_MAX = 3;

/**
 * Base trust awarded per report source. Automated observations from official
 * weather providers are inherently more reliable than an anonymous citizen
 * submission, so they must not be scored with the same base as a citizen
 * report (which has no reporter/media history to draw on).
 */
const SOURCE_TRUST: Record<SourceType, number> = {
  [SourceType.IMD]: 25,
  [SourceType.IOT]: 25,
  [SourceType.OPENWEATHER]: 20,
  [SourceType.WEATHERAPI]: 20,
  [SourceType.CITIZEN]: 0,
  [SourceType.NEWS]: 0,
  [SourceType.INTERNET]: 0,
};

export interface DuplicateQuery {
  category: EventCategory;
  text: string;
  city?: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface DuplicateMatch {
  id: string;
  score: number;
  similarity: number;
  proximity: number;
}

export interface DuplicateResult {
  isDuplicate: boolean;
  duplicateOfId: string | null;
  bestScore: number;
  matches: DuplicateMatch[];
}

export interface TrustAssessmentInput {
  aiConfidence: number | null;
  aiMethod?: MlMethod | null;
  latitude?: number | null;
  longitude?: number | null;
  mediaCount?: number;
  city?: string;
  state?: string;
  isDuplicate: boolean;
  userCredibility: number;
  source?: SourceType;
}

export interface TrustFactors {
  base: number;
  reporter: number;
  location: number;
  media: number;
  place: number;
  ai: number;
  source: number;
  duplicate: number;
}

export interface TrustAssessment {
  score: number;
  factors: TrustFactors;
}

@Injectable()
export class MlService {
  private readonly logger = new Logger(MlService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async classify(text: string): Promise<MlPrediction> {
    const base = this.config.get<string>('ML_SERVICE_URL') ?? 'http://localhost:8000';
    const token = this.config.get<string>('ML_API_TOKEN') ?? '';
    const insecure = this.config.get<string>('ML_INSECURE_DEV_MODE') === 'true';
    const timeoutMs = Number(
      this.config.get<string>('ML_TIMEOUT_MS') ?? '60000',
    );

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetch(`${base}/api/classify`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ text }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) throw new Error(`ML service responded ${res.status}`);
      const data = (await res.json()) as {
        category: string;
        confidence: number;
        method?: string;
      };
      const category = this.normalizeCategory(data.category);
      const confidence = Math.min(0.99, Math.max(0, data.confidence ?? 0.6));
      const method: MlMethod = data.method === 'model' ? 'model' : 'keyword';
      return { category, confidence, method, trustScore: this.deriveTrust(confidence, method) };
    } catch (err) {
      this.logger.warn(
        `ML service unavailable (${String(err)}). Falling back to keyword classifier.`,
      );
      if (!insecure) {
        return { category: null, confidence: null, method: 'fallback', trustScore: null };
      }
      return this.keywordFallback(text);
    }
  }

  normalizeCategory(raw: string | null | undefined): MlPrediction['category'] {
    if (!raw) return null;
    const key = raw.toUpperCase().replace(/[\s-]/g, '_');
    const valid = Object.values(EventCategory) as string[];
    if (valid.includes(key)) return key as EventCategory;
    return EventCategory.OTHER;
  }

  async findDuplicates(query: DuplicateQuery): Promise<DuplicateResult> {
    const candidates = await this.prisma.report.findMany({
      where: {
        category: query.category,
        status: { in: [ReportStatus.PENDING, ReportStatus.VERIFIED] },
        reportedAt: { gte: new Date(Date.now() - DUPLICATE_WINDOW_MS) },
        ...(query.city
          ? { city: { equals: query.city, mode: 'insensitive' } }
          : {}),
      },
      take: 100,
      select: {
        id: true,
        title: true,
        description: true,
        latitude: true,
        longitude: true,
      },
    });

    const matches = candidates
      .map((c) => {
        const similarity = jaccardSimilarity(
          query.text,
          `${c.title} ${c.description ?? ''}`,
        );
        let proximity = 0;
        if (
          query.latitude != null &&
          query.longitude != null &&
          c.latitude != null &&
          c.longitude != null
        ) {
          proximity =
            haversineDistanceKm(
              query.latitude,
              query.longitude,
              c.latitude,
              c.longitude,
            ) <= DUPLICATE_RADIUS_KM
              ? 0.1
              : 0;
        }
        return { id: c.id, score: similarity + proximity, similarity, proximity };
      })
      .filter((c) => c.score >= DUPLICATE_TEXT_THRESHOLD)
      .sort((a, b) => b.score - a.score)
      .slice(0, DUPLICATE_MAX);

    return {
      isDuplicate: matches.length > 0,
      duplicateOfId: matches[0]?.id ?? null,
      bestScore: matches[0]?.score ?? 0,
      matches,
    };
  }

  assessTrust(input: TrustAssessmentInput): TrustAssessment {
    const factors: TrustFactors = {
      base: 30,
      reporter: Math.round((input.userCredibility - 50) * 0.2),
      location:
        input.latitude != null && input.longitude != null ? 12 : 0,
      media: (input.mediaCount ?? 0) > 0 ? 10 : 0,
      place: input.city && input.state ? 4 : 0,
      ai: input.aiConfidence != null ? Math.round(input.aiConfidence * 20) : 0,
      source: input.source ? SOURCE_TRUST[input.source] ?? 0 : 0,
      duplicate: input.isDuplicate ? 8 : 0,
    };
    const score = clamp(
      Object.values(factors).reduce((sum, v) => sum + v, 0),
      0,
      100,
    );
    return { score, factors };
  }

  inferSeverity(
    category: EventCategory,
    confidence: number | null,
  ): Severity {
    const base = baseSeverityForCategory(category);
    if (confidence != null && confidence > 0.85) {
      const idx = SEVERITIES.indexOf(base);
      if (idx >= 0 && idx < SEVERITIES.length - 1) {
        return SEVERITIES[idx + 1];
      }
    }
    return base;
  }

  private deriveTrust(confidence: number, method: MlMethod): number {
    return clamp(
      Math.round(confidence * 100 + (method === 'model' ? 10 : method === 'keyword' ? 2 : 0)),
      0,
      100,
    );
  }

  private keywordFallback(text: string): MlPrediction {
    const t = text.toLowerCase();
    const rules: Array<[RegExp, EventCategory]> = [
      [/\b(cloudburst|flash flood)\b/, EventCategory.FLASH_FLOOD],
      [/\b(flood|flooding|inundat|submerg|waterlog)\b/, EventCategory.FLOOD],
      [/\b(heavy rain|torrential|downpour|cloudbr)\b/, EventCategory.HEAVY_RAINFALL],
      [/\b(thunder|lightning|stormy)\b/, EventCategory.THUNDERSTORM],
      [/\b(lightning|thunderbolt)\b/, EventCategory.LIGHTNING],
      [/\b(cyclone|typhoon|hurricane)\b/, EventCategory.CYCLONE],
      [/\b(heatwave|heat wave|scorching)\b/, EventCategory.HEATWAVE],
      [/\b(cold wave|coldwave|chilly)\b/, EventCategory.COLD_WAVE],
      [/\b(dense fog)\b/, EventCategory.DENSE_FOG],
      [/\b(fog|low visibility)\b/, EventCategory.FOG],
      [/\b(dust storm|sandstorm)\b/, EventCategory.DUST_STORM],
      [/\b(strong wind|gale|high wind)\b/, EventCategory.STRONG_WIND],
      [/\b(hail|hailstorm)\b/, EventCategory.HAILSTORM],
      [/\b(snow|snowfall|blizzard)\b/, EventCategory.SNOWFALL],
      [/\b(drought|water shortage|dry spell)\b/, EventCategory.DROUGHT],
      [/\b(landslide|landslip|mudslide)\b/, EventCategory.LANDSLIDE],
      [/\b(rain|rainfall|shower|drizzle)\b/, EventCategory.RAINFALL],
    ];
    for (const [re, category] of rules) {
      if (re.test(t)) {
        return {
          category,
          confidence: 0.65,
          method: 'keyword',
          trustScore: this.deriveTrust(0.65, 'keyword'),
        };
      }
    }
    return {
      category: EventCategory.OTHER,
      confidence: 0.4,
      method: 'keyword',
      trustScore: this.deriveTrust(0.4, 'keyword'),
    };
  }
}