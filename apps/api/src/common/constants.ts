import { EventCategory, Severity } from '@prisma/client';

export const EVENT_CATEGORIES: EventCategory[] = [
  EventCategory.RAINFALL,
  EventCategory.HEAVY_RAINFALL,
  EventCategory.FLOOD,
  EventCategory.FLASH_FLOOD,
  EventCategory.THUNDERSTORM,
  EventCategory.LIGHTNING,
  EventCategory.CYCLONE,
  EventCategory.HEATWAVE,
  EventCategory.COLD_WAVE,
  EventCategory.FOG,
  EventCategory.DENSE_FOG,
  EventCategory.DUST_STORM,
  EventCategory.STRONG_WIND,
  EventCategory.HAILSTORM,
  EventCategory.SNOWFALL,
  EventCategory.DROUGHT,
  EventCategory.LANDSLIDE,
  EventCategory.CLOUDBURST,
  EventCategory.WATERLOGGING,
  EventCategory.OTHER,
];

export const SEVERITIES: Severity[] = [
  Severity.LOW,
  Severity.MODERATE,
  Severity.HIGH,
  Severity.SEVERE,
  Severity.CRITICAL,
];

export const AUTO_ALERT_MIN_SEVERITY: Severity = Severity.HIGH;
export const AUTO_ALERT_MIN_CREDIBILITY = 60;
export const AUTO_ALERT_DURATION_MS = 72 * 60 * 60 * 1000;
export const AUTO_ALERT_DUPLICATE_WINDOW_MS = 24 * 60 * 60 * 1000;

export function severityRank(severity: Severity): number {
  const idx = SEVERITIES.indexOf(severity);
  return idx === -1 ? 0 : idx;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function jaccardSimilarity(a: string, b: string): number {
  const tokenize = (s: string) =>
    new Set(
      s
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 2),
    );
  const setA = tokenize(a);
  const setB = tokenize(b);
  if (setA.size === 0 || setB.size === 0) return 0;
  let inter = 0;
  for (const w of setA) if (setB.has(w)) inter++;
  const union = setA.size + setB.size - inter;
  return union === 0 ? 0 : inter / union;
}

export function baseSeverityForCategory(category: EventCategory): Severity {
  switch (category) {
    case EventCategory.CYCLONE:
    case EventCategory.HEAVY_RAINFALL:
    case EventCategory.FLASH_FLOOD:
      return Severity.HIGH;
    case EventCategory.HEATWAVE:
    case EventCategory.CLOUDBURST:
      return Severity.SEVERE;
    case EventCategory.FLOOD:
    case EventCategory.LANDSLIDE:
    case EventCategory.HAILSTORM:
      return Severity.HIGH;
    case EventCategory.THUNDERSTORM:
    case EventCategory.STRONG_WIND:
    case EventCategory.DUST_STORM:
      return Severity.MODERATE;
    default:
      return Severity.MODERATE;
  }
}