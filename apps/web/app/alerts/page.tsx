'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { BellRing, MapPin, Power, PowerOff, ShieldCheck, Timer } from 'lucide-react';
import { useAuth } from '@/components/AuthContext';
import { useGet } from '@/hooks/useApi';
import { apiFetch } from '@/lib/api';
import type { AlertItem } from '@/lib/types';
import { categoryStyle, timeAgo, timeUntil } from '@/lib/constants';
import { SeverityBadge } from '@/components/badges';

const SEVERITY_RANK: Record<string, number> = {
  CRITICAL: 5,
  SEVERE: 4,
  HIGH: 3,
  MODERATE: 2,
  LOW: 1,
};

export default function AlertsPage() {
  const { user, session } = useAuth();
  const token = session?.access_token;
  const isAdmin = !!user && user.role !== 'USER';

  const { data, loading, reload } = useGet<AlertItem[]>(
    isAdmin ? '/api/admin/alerts' : '/api/alerts',
    token,
  );

  const [showInactive, setShowInactive] = useState(false);
  const [severityFilter, setSeverityFilter] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const alerts = useMemo(() => {
    const list = (data ?? []).filter((a) => (isAdmin && showInactive) || a.isActive);
    const filtered = severityFilter
      ? list.filter((a) => a.severity === severityFilter)
      : list;
    return [...filtered].sort(
      (a, b) =>
        (SEVERITY_RANK[b.severity] ?? 0) - (SEVERITY_RANK[a.severity] ?? 0) ||
        new Date(b.startAt).getTime() - new Date(a.startAt).getTime(),
    );
  }, [data, isAdmin, showInactive, severityFilter]);

  const activeCount = (data ?? []).filter((a) => a.isActive).length;

  const toggle = async (alert: AlertItem) => {
    try {
      await apiFetch(`/api/alerts/${alert.id}/${alert.isActive ? 'deactivate' : 'activate'}`, {
        method: 'PATCH',
        token,
      });
      setNotice(alert.isActive ? 'Alert deactivated' : 'Alert activated');
      reload();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Action failed');
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            <BellRing className="text-amber-500" size={22} /> Weather alerts
          </h1>
          <p className="text-sm text-slate-500">
            {activeCount} active alert{activeCount === 1 ? '' : 's'} across India
          </p>
        </div>
        {isAdmin && (
          <Link
            href="/admin"
            className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Manage in admin
          </Link>
        )}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setSeverityFilter(null)}
          className={`rounded-full px-3 py-1.5 text-xs font-medium ${
            severityFilter === null
              ? 'bg-brand-600 text-white'
              : 'bg-white text-slate-600 ring-1 ring-slate-200'
          }`}
        >
          All severities
        </button>
        {(['CRITICAL', 'SEVERE', 'HIGH', 'MODERATE', 'LOW'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSeverityFilter(s)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              severityFilter === s
                ? 'bg-brand-600 text-white'
                : 'bg-white text-slate-600 ring-1 ring-slate-200'
            }`}
          >
            {s}
          </button>
        ))}
        {isAdmin && (
          <label className="ml-auto inline-flex items-center gap-2 text-xs font-medium text-slate-600">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            Show inactive
          </label>
        )}
      </div>

      {notice && (
        <div className="mb-4 rounded-xl bg-slate-900 px-4 py-2 text-sm text-white">{notice}</div>
      )}

      <div className="space-y-3">
        {loading && <div className="card text-slate-400">Loading alerts…</div>}

        {!loading && alerts.length === 0 && (
          <div className="card text-center text-slate-500">
            <ShieldCheck className="mx-auto mb-2 text-emerald-500" />
            No alerts right now. Conditions are normal.
          </div>
        )}

        {alerts.map((alert) => {
          const style = categoryStyle(alert.category);
          return (
            <div key={alert.id} className="card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="text-2xl leading-none">{style.emoji}</span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-900">{alert.title}</p>
                      <SeverityBadge severity={alert.severity} />
                      {!alert.isActive && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                          INACTIVE
                        </span>
                      )}
                      {!alert.createdBy && (
                        <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-medium text-violet-700">
                          AI-generated
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{alert.message}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={12} />
                        {[alert.city, alert.state].filter(Boolean).join(', ') || 'Nationwide'}
                      </span>
                      <span>{style.label}</span>
                      <span>{timeAgo(alert.startAt)}</span>
                      {alert.isActive && alert.endAt && (
                        <span className="inline-flex items-center gap-1">
                          <Timer size={12} /> expires in {timeUntil(alert.endAt)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {isAdmin && (
                  <button
                    onClick={() => toggle(alert)}
                    className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium ${
                      alert.isActive
                        ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200 hover:bg-amber-100'
                        : 'bg-emerald-600 text-white hover:bg-emerald-700'
                    }`}
                  >
                    {alert.isActive ? <PowerOff size={14} /> : <Power size={14} />}
                    {alert.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
