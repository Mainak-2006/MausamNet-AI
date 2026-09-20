export interface Profile {
  id: string;
  email: string;
  name: string | null;
  username: string | null;
  avatarUrl: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  credibilityScore: number;
  createdAt: string;
  _count?: { reports: number };
}

export type EventCategory =
  | 'RAINFALL'
  | 'HEAVY_RAINFALL'
  | 'FLOOD'
  | 'FLASH_FLOOD'
  | 'THUNDERSTORM'
  | 'LIGHTNING'
  | 'CYCLONE'
  | 'HEATWAVE'
  | 'COLD_WAVE'
  | 'FOG'
  | 'DENSE_FOG'
  | 'DUST_STORM'
  | 'STRONG_WIND'
  | 'HAILSTORM'
  | 'SNOWFALL'
  | 'DROUGHT'
  | 'LANDSLIDE'
  | 'CLOUDBURST'
  | 'WATERLOGGING'
  | 'OTHER';

export type ReportStatus =
  | 'PENDING'
  | 'VERIFIED'
  | 'UNVERIFIED'
  | 'SUSPICIOUS'
  | 'REJECTED';

export type Severity = 'LOW' | 'MODERATE' | 'HIGH' | 'SEVERE' | 'CRITICAL';

export interface ReportMedia {
  id: string;
  url: string;
  type: 'IMAGE' | 'VIDEO';
}

export interface ReportAuthor {
  id: string;
  name: string | null;
  avatarUrl: string | null;
  credibilityScore: number;
}

export interface Report {
  id: string;
  title: string;
  description: string | null;
  category: EventCategory;
  severity: Severity;
  status: ReportStatus;
  city: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  reportedAt: string;
  aiPrediction: EventCategory | null;
  aiConfidence: number | null;
  credibilityScore: number;
  isDuplicate: boolean;
  duplicateOfId: string | null;
  verificationNotes: string | null;
  author: ReportAuthor | null;
  media: ReportMedia[];
}

export interface Paginated<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; pages: number };
}

export interface OverviewStats {
  totalReports: number;
  verifiedReports: number;
  pendingReports: number;
  suspiciousReports: number;
  rejectedReports: number;
  todayReports: number;
  activeAlerts: number;
  highSeverity: number;
  registeredUsers: number;
  avgCredibility: number;
}

export interface Warning {
  icon: string;
  title: string;
  detail: string;
}

export interface AlertItem {
  id: string;
  title: string;
  message: string;
  category: EventCategory;
  severity: Severity;
  city: string | null;
  state: string | null;
  startAt: string;
  endAt: string | null;
  isActive: boolean;
  source?: string;
  createdBy?: { id: string; name: string | null } | null;
}
export interface SyncStatus {
  syncEnabled: boolean;
  kafka: { enabled: boolean; connected: boolean; brokers: string[] };
  schedule: { enabled: boolean; intervalMinutes: number; nextRunAt: string | null };
  providers: { name: string; configured: boolean }[];
  locations: { districts: number; cities: number; withCoordinates: number };
  activeRun: SyncRun | null;
  lastRun: SyncRun | null;
  reportSync: { enabled: boolean; totalGenerated: number; totalSkipped: number };
}

export interface ReportSyncStatus {
  enabled: boolean;
  stats: { totalGenerated: number; totalSkipped: number };
}

export interface SyncRun {
  id: string;
  trigger: string;
  status: string;
  scope: string;
  total: number;
  succeeded: number;
  failed: number;
  skipped: number;
  startedAt: string;
  finishedAt: string | null;
  triggeredBy: string | null;
  reportsGenerated: number;
  reportsSkipped: number;
}
