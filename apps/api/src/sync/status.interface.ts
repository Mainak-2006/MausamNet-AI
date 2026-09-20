import { SyncRun, SyncRunStatus } from '@prisma/client';

export interface WeatherSyncStatus {
  syncEnabled: boolean;
  kafka: {
    enabled: boolean;
    connected: boolean;
    brokers: string[];
  };
  schedule: {
    enabled: boolean;
    intervalMinutes: number;
    nextRunAt: Date | null;
  };
  providers: { name: string; configured: boolean }[];
  locations: { districts: number; cities: number; withCoordinates: number };
  activeRun: SyncRun | null;
  lastRun: SyncRun | null;
  reportSync: { enabled: boolean; totalGenerated: number; totalSkipped: number };
}

export interface SyncRunSummary {
  id: string;
  trigger: string;
  status: SyncRunStatus;
  scope: string;
  total: number;
  succeeded: number;
  failed: number;
  skipped: number;
  startedAt: Date;
  finishedAt: Date | null;
  triggeredBy: string | null;
}