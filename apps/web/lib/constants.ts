export const EVENT_CATEGORIES = [
  'RAINFALL',
  'HEAVY_RAINFALL',
  'FLOOD',
  'FLASH_FLOOD',
  'THUNDERSTORM',
  'LIGHTNING',
  'CYCLONE',
  'HEATWAVE',
  'COLD_WAVE',
  'FOG',
  'DENSE_FOG',
  'DUST_STORM',
  'STRONG_WIND',
  'HAILSTORM',
  'SNOWFALL',
  'DROUGHT',
  'LANDSLIDE',
  'CLOUDBURST',
  'WATERLOGGING',
  'OTHER',
] as const;

export const REPORT_STATUSES = [
  'PENDING',
  'VERIFIED',
  'UNVERIFIED',
  'SUSPICIOUS',
  'REJECTED',
] as const;

export const SEVERITIES = [
  'LOW',
  'MODERATE',
  'HIGH',
  'SEVERE',
  'CRITICAL',
] as const;

const CATEGORY_STYLE: Record<string, { label: string; color: string; emoji: string }> = {
  RAINFALL: { label: 'Rainfall', color: '#3b82f6', emoji: '🌧️' },
  HEAVY_RAINFALL: { label: 'Heavy Rainfall', color: '#1d4ed8', emoji: '⛈️' },
  FLOOD: { label: 'Flood', color: '#0ea5e9', emoji: '🌊' },
  FLASH_FLOOD: { label: 'Flash Flood', color: '#0284c7', emoji: '🌊' },
  THUNDERSTORM: { label: 'Thunderstorm', color: '#a855f7', emoji: '⛈️' },
  LIGHTNING: { label: 'Lightning', color: '#f59e0b', emoji: '⚡' },
  CYCLONE: { label: 'Cyclone', color: '#ef4444', emoji: '🌀' },
  HEATWAVE: { label: 'Heatwave', color: '#f97316', emoji: '🔥' },
  COLD_WAVE: { label: 'Cold Wave', color: '#60a5fa', emoji: '🥶' },
  FOG: { label: 'Fog', color: '#94a3b8', emoji: '🌫️' },
  DENSE_FOG: { label: 'Dense Fog', color: '#64748b', emoji: '🌫️' },
  DUST_STORM: { label: 'Dust Storm', color: '#b45309', emoji: '🌪️' },
  STRONG_WIND: { label: 'Strong Wind', color: '#10b981', emoji: '💨' },
  HAILSTORM: { label: 'Hailstorm', color: '#8b9dc3', emoji: '🧊' },
  SNOWFALL: { label: 'Snowfall', color: '#e2e8f0', emoji: '❄️' },
  DROUGHT: { label: 'Drought', color: '#d97706', emoji: '🏜️' },
  LANDSLIDE: { label: 'Landslide', color: '#78716c', emoji: '🏔️' },
  CLOUDBURST: { label: 'Cloudburst', color: '#0c4a6e', emoji: '🌧️' },
  WATERLOGGING: { label: 'Waterlogging', color: '#22d3ee', emoji: '💦' },
  OTHER: { label: 'Other', color: '#6b7280', emoji: '🌡️' },
};

const STATUS_STYLE: Record<string, { label: string; className: string }> = {
  PENDING: { label: 'Pending', className: 'bg-amber-100 text-amber-800' },
  VERIFIED: { label: 'Verified', className: 'bg-emerald-100 text-emerald-800' },
  UNVERIFIED: { label: 'Unverified', className: 'bg-slate-100 text-slate-700' },
  SUSPICIOUS: { label: 'Suspicious', className: 'bg-red-100 text-red-800' },
  REJECTED: { label: 'Rejected', className: 'bg-zinc-200 text-zinc-700' },
};

const SEVERITY_STYLE: Record<string, { className: string }> = {
  LOW: { className: 'bg-slate-100 text-slate-700' },
  MODERATE: { className: 'bg-blue-100 text-blue-800' },
  HIGH: { className: 'bg-orange-100 text-orange-800' },
  SEVERE: { className: 'bg-red-100 text-red-800' },
  CRITICAL: { className: 'bg-purple-100 text-purple-800' },
};

export function categoryStyle(key: string) {
  return CATEGORY_STYLE[key] ?? CATEGORY_STYLE.OTHER;
}

export function statusStyle(key: string) {
  return STATUS_STYLE[key] ?? STATUS_STYLE.PENDING;
}

export function severityStyle(key: string) {
  return SEVERITY_STYLE[key] ?? SEVERITY_STYLE.MODERATE;
}

export function timeUntil(iso: string, now = Date.now()): string {
  const ms = new Date(iso).getTime() - now;
  if (ms <= 0) return 'now';
  const total = Math.floor(ms / 1000);
  if (total < 60) return `${total}s`;
  const minutes = Math.floor(total / 60);
  if (minutes < 60) return `${minutes}m ${total % 60}s`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

export function timeAgo(iso: string): string {
  const seconds = Math.max(
    0,
    Math.floor((Date.now() - new Date(iso).getTime()) / 1000),
  );
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}