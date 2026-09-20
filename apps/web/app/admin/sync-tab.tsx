'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  CloudSun,
  Database,
  OctagonX,
  Radio,
  RefreshCw,
  Satellite,
  Timer,
  Power,
  PowerOff,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useGet } from '@/hooks/useApi';
import type { SyncRun, SyncStatus } from '@/lib/types';
import { timeAgo, timeUntil } from '@/lib/constants';

function runStatusStyle(status: string) {
  switch (status) {
    case 'RUNNING':
      return 'bg-blue-100 text-blue-700';
    case 'COMPLETED':
      return 'bg-emerald-100 text-emerald-700';
    case 'PARTIAL':
      return 'bg-amber-100 text-amber-700';
    case 'FAILED':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-slate-100 text-slate-600';
  }
}

function progress(run: SyncRun) {
  if (!run.total) return 0;
  return Math.round(((run.succeeded + run.failed + run.skipped) / run.total) * 100);
}

export function SyncTab({ token }: { token?: string | null }) {
  const [syncData, setSyncData] = useState<SyncStatus | null>(null);
  const [runs, setRuns] = useState<SyncRun[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [ingestionBusy, setIngestionBusy] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const statusPath = '/api/admin/weather/sync';
  const { data: statusData, reload } = useGet<SyncStatus>(statusPath, token);
  const { data: runsData, reload: reloadRuns } = useGet<SyncRun[]>('/api/admin/weather/sync/runs?limit=10', token);

  useEffect(() => setSyncData(statusData), [statusData]);
  useEffect(() => setRuns(runsData ?? []), [runsData]);

  const active = useMemo(
    () => runs.find((r) => r.status === 'RUNNING' || r.status === 'QUEUED') ?? null,
    [runs],
  );

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => {
      reload();
      reloadRuns();
    }, 8000);
    return () => clearInterval(id);
  }, [active, reload, reloadRuns]);

  const syncNow = async (scope: 'all' | 'districts' | 'cities') => {
    setSyncing(true);
    setNotice(null);
    try {
      const res = await apiFetch<{ runId: string; locations: number; kafka: boolean }>(statusPath, {
        method: 'POST',
        token,
        body: { scope },
      });
      setNotice(`Sync started: ${res.locations} locations${res.kafka ? ' via Kafka' : ' (in-process)'}`);
      reload();
      reloadRuns();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Sync failed to start');
    } finally {
      setSyncing(false);
    }
  };

  const killSync = async () => {
    setBusy(true);
    setNotice(null);
    try {
      const res = await apiFetch<{ cancelled: number }>(`${statusPath}/cancel`, {
        method: 'POST',
        token,
      });
      setNotice(res.cancelled > 0 ? 'Sync stopped' : 'No active sync to stop');
      reload();
      reloadRuns();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Failed to stop sync');
    } finally {
      setBusy(false);
    }
  };

  const startIngestion = async () => {
    setIngestionBusy(true);
    setNotice(null);
    try {
      await apiFetch('/api/admin/weather/report-sync/start', { method: 'POST', token });
      setNotice('Report ingestion started');
      reload();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Failed to start ingestion');
    } finally {
      setIngestionBusy(false);
    }
  };

  const stopIngestion = async () => {
    setIngestionBusy(true);
    setNotice(null);
    try {
      await apiFetch('/api/admin/weather/report-sync/stop', { method: 'POST', token });
      setNotice('Report ingestion stopped');
      reload();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Failed to stop ingestion');
    } finally {
      setIngestionBusy(false);
    }
  };

  if (!syncData) {
    return <div className="card text-slate-400">Loading sync status…</div>;
  }

  const rs = syncData.reportSync;

  const cards = [
    {
      label: 'Providers',
      value: syncData.providers.filter((p) => p.configured).length + ' / ' + syncData.providers.length,
      icon: <Satellite size={16} />,
      sub: syncData.providers.map((p) => p.name).join(', '),
    },
    {
      label: 'Locations',
      value: syncData.locations.withCoordinates.toLocaleString(),
      icon: <Database size={16} />,
      sub: `${syncData.locations.districts.toLocaleString()} districts · ${syncData.locations.cities.toLocaleString()} cities`,
    },
    {
      label: 'Auto-sync',
      value: `${syncData.schedule.intervalMinutes}m`,
      icon: <Timer size={16} />,
      sub: syncData.schedule.nextRunAt
        ? `next in ${timeUntil(syncData.schedule.nextRunAt, now)}`
        : 'disabled',
    },
    {
      label: 'Kafka',
      value: syncData.kafka.enabled ? (syncData.kafka.connected ? 'connected' : 'down') : 'off',
      icon: <Radio size={16} />,
      sub: syncData.kafka.brokers.join(','),
    },
  ];

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CloudSun size={18} className="text-brand-600" />
          <p className="text-sm font-semibold text-slate-900">
            Every {syncData.schedule.intervalMinutes} minutes, weather from OpenWeather + WeatherAPI
            is synced for every district and major city in India.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => syncNow('all')}
            disabled={syncing || !!active}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RefreshCw size={15} className={syncing ? 'animate-spin' : ''} />
            Sync now
          </button>
          <select
            defaultValue="all"
            disabled={syncing || !!active}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 disabled:opacity-40"
            onChange={(e) => syncNow(e.target.value as 'all' | 'districts' | 'cities')}
          >
            <option value="" disabled>
              Run scope…
            </option>
            <option value="all">All locations</option>
            <option value="districts">Districts only</option>
            <option value="cities">Major cities only</option>
          </select>
        </div>
      </div>

      {notice && (
        <div className="mb-4 rounded-xl bg-slate-900 px-4 py-2 text-sm text-white">{notice}</div>
      )}

      {active && (
        <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="font-semibold text-blue-800">
              Sync in progress — {active.succeeded + active.failed + active.skipped} / {active.total}
            </span>
            <div className="flex items-center gap-3">
              <span className="text-blue-600">
                {active.succeeded} ok · {active.failed} failed
              </span>
              <button
                onClick={killSync}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <OctagonX size={14} className={busy ? 'animate-spin' : ''} />
                Stop sync
              </button>
            </div>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-blue-100">
            <div
              className="h-full bg-blue-600 transition-all"
              style={{ width: `${progress(active)}%` }}
            />
          </div>
        </div>
      )}

      {/* Report Sync / Ingestion Control */}
      <div className="mb-5 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-slate-100 p-2 text-slate-600">
              {rs?.enabled ? <Power size={18} className="text-emerald-600" /> : <PowerOff size={18} className="text-red-500" />}
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">
                Report Ingestion {rs?.enabled ? 'ON' : 'OFF'}
              </div>
              <div className="text-xs text-slate-500">
                {rs?.totalGenerated ?? 0} reports generated · {rs?.totalSkipped ?? 0} skipped
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!rs?.enabled ? (
              <button
                onClick={startIngestion}
                disabled={ingestionBusy}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-40"
              >
                <Power size={14} /> Start
              </button>
            ) : (
              <button
                onClick={stopIngestion}
                disabled={ingestionBusy}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-40"
              >
                <PowerOff size={14} /> Stop
              </button>
            )}
          </div>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          When enabled, non-benign weather conditions are automatically converted to reports during each sync run.
        </p>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="card flex items-start gap-3">
            <div className="rounded-lg bg-slate-100 p-2 text-slate-600">{c.icon}</div>
            <div>
              <div className="text-sm font-bold text-slate-900">{c.value}</div>
              <div className="text-[11px] text-slate-400">{c.label}</div>
              <div className="mt-1 text-xs text-slate-500">{c.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {syncData.lastRun && (
        <div className="mb-5 card">
          <div className="mb-1 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">Last sync</p>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${runStatusStyle(syncData.lastRun.status)}`}>
              {syncData.lastRun.status}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            {syncData.lastRun.scope} · trigger {syncData.lastRun.trigger} ·{' '}
            {syncData.lastRun.succeeded} ok, {syncData.lastRun.failed} failed,{' '}
            {syncData.lastRun.skipped} skipped · {syncData.lastRun.reportsGenerated} reports · {timeAgo(syncData.lastRun.startedAt)}
          </p>
        </div>
      )}

      {runs.length > 0 && (
        <div className="card">
          <p className="mb-2 text-sm font-semibold text-slate-900">Recent runs</p>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase text-slate-400">
                <th className="py-2 pr-3">Trigger</th>
                <th className="py-2 pr-3">Scope</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Total</th>
                <th className="py-2 pr-3">OK</th>
                <th className="py-2 pr-3">Failed</th>
                <th className="py-2 pr-3">When</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r) => (
                <tr key={r.id} className="border-b border-slate-50">
                  <td className="py-2 pr-3 text-slate-600">{r.trigger}</td>
                  <td className="py-2 pr-3 text-slate-600">{r.scope}</td>
                  <td className="py-2 pr-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${runStatusStyle(r.status)}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="py-2 pr-3">{r.total}</td>
                  <td className="py-2 pr-3 text-emerald-600">{r.succeeded}</td>
                  <td className="py-2 pr-3 text-red-600">{r.failed}</td>
                  <td className="py-2 text-slate-400">{timeAgo(r.startedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {runs.length === 0 && (
        <div className="card text-slate-500">
          No syncs yet. Sync now samples all 763 districts + 306 major cities.
        </div>
      )}
    </div>
  );
}
