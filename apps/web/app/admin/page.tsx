'use client';

import { useMemo, useState } from 'react';
import { Ban, BellRing, CheckCircle2, ClipboardList, CloudSun, Plus, ShieldAlert, Shuffle, UserMinus, UserCheck } from 'lucide-react';
import { useAuth } from '@/components/AuthContext';
import { useGet } from '@/hooks/useApi';
import { apiFetch } from '@/lib/api';
import type { OverviewStats, Paginated, Report } from '@/lib/types';
import { categoryStyle, timeAgo } from '@/lib/constants';
import { StatusBadge, SeverityBadge, CategoryIcon } from '@/components/badges';
import { SyncTab } from './sync-tab';
import { AlertsTab } from './alerts-tab';

interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  suspended: boolean;
  banned: boolean;
  credibilityScore: number;
  city: string | null;
  state: string | null;
  createdAt: string;
  _count?: { reports: number };
}

interface AuditRow {
  id: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  createdAt: string;
  actor: { name: string | null; email: string } | null;
}

type Tab = 'reports' | 'users' | 'alerts' | 'sync' | 'logs';

export default function AdminPage() {
  const { user, session } = useAuth();
  const token = session?.access_token;

  const [tab, setTab] = useState<Tab>('reports');
  const [statusFilter, setStatusFilter] = useState<'PENDING' | 'SUSPICIOUS' | 'VERIFIED' | 'REJECTED'>('PENDING');
  const [notice, setNotice] = useState<string | null>(null);

  const reportsPath = useMemo(
    () => `/api/admin/reports?status=${statusFilter}&limit=20`,
    [statusFilter],
  );
  const { data: reportsData, loading, reload } = useGet<Paginated<Report>>(reportsPath, token);
  const { data: stats } = useGet<OverviewStats>('/api/analytics/overview');
  const { data: usersData, reload: reloadUsers } = useGet<Paginated<AdminUser>>('/api/admin/users?limit=20', token);
  const { data: logsData } = useGet<Paginated<AuditRow>>('/api/admin/audit-logs?limit=15', token);

  if (!user || user.role === 'USER') {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="text-lg font-semibold text-slate-900">Access restricted</p>
        <p className="text-sm text-slate-500">This area is for administrators only.</p>
      </div>
    );
  }

  const act = async (report: Report, action: 'verify' | 'reject' | 'suspect') => {
    const notes = window.prompt('Verification note (optional):') ?? undefined;
    try {
      await apiFetch(`/api/admin/reports/${report.id}/${action}`, {
        method: 'POST',
        token,
        body: notes ? { notes } : {},
      });
      setNotice(`${report.title} → ${action.toUpperCase()}`);
      reload();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Action failed');
    }
  };

  const userAction = async (u: AdminUser, action: 'suspend' | 'ban' | 'reactivate') => {
    try {
      await apiFetch(`/api/admin/users/${u.id}/${action}`, { method: 'POST', token });
      reloadUsers();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Action failed');
    }
  };

  const statsCards = [
    { label: 'Total', value: stats?.totalReports ?? '—' },
    { label: 'Verified', value: stats?.verifiedReports ?? '—' },
    { label: 'Pending', value: stats?.pendingReports ?? '—' },
    { label: 'Suspicious', value: stats?.suspiciousReports ?? '—' },
    { label: 'Users', value: stats?.registeredUsers ?? '—' },
  ];

  const tabs: Array<{ id: Tab; label: string; icon: React.ReactNode }> = [
    { id: 'reports', label: 'Reports', icon: <ClipboardList size={16} /> },
    { id: 'users', label: 'Users', icon: <UserCheck size={16} /> },
    { id: 'alerts', label: 'Alerts', icon: <BellRing size={16} /> },
    { id: 'sync', label: 'Weather sync', icon: <CloudSun size={16} /> },
    { id: 'logs', label: 'Audit logs', icon: <ClipboardList size={16} /> },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin control center</h1>
          <p className="text-sm text-slate-500">Verification, moderation and platform analytics</p>
        </div>
        <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
          ADMIN
        </span>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        {statsCards.map((s) => (
          <div key={s.label} className="card">
            <div className="text-xl font-bold text-slate-900">{s.value}</div>
            <div className="text-xs text-slate-500">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="mb-4 flex gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium ${
              tab === t.id
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-600 ring-1 ring-slate-200'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {notice && (
        <div className="mb-4 rounded-xl bg-slate-900 px-4 py-2 text-sm text-white">{notice}</div>
      )}

      {tab === 'reports' && (
        <div>
          <div className="mb-4 flex flex-wrap gap-2">
            {(['PENDING', 'SUSPICIOUS', 'VERIFIED', 'REJECTED'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                  statusFilter === s
                    ? 'bg-brand-600 text-white'
                    : 'bg-white text-slate-600 ring-1 ring-slate-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {loading && <div className="card text-slate-400">Loading…</div>}
            {(reportsData?.data ?? []).map((r) => (
              <div key={r.id} className="card">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <CategoryIcon category={r.category} size={18} />
                    <div>
                      <p className="font-semibold text-slate-900">{r.title}</p>
                      <p className="text-xs text-slate-500">
                        {[r.city, r.state].filter(Boolean).join(', ') || 'Unknown'} ·{' '}
                        {timeAgo(r.reportedAt)} · AI {r.aiConfidence != null ? Math.round(r.aiConfidence * 100) : '—'}%
                        · credibility {r.credibilityScore}
                      </p>
                      {r.isDuplicate && (
                        <span className="mt-1 inline-block rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-medium text-violet-700">
                          Possible duplicate
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={r.status} />
                    <SeverityBadge severity={r.severity} />
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                  <button
                    onClick={() => act(r, 'verify')}
                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                  >
                    <CheckCircle2 size={14} /> Verify
                  </button>
                  <button
                    onClick={() => act(r, 'suspect')}
                    className="inline-flex items-center gap-1 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-600"
                  >
                    <ShieldAlert size={14} /> Flag suspicious
                  </button>
                  <button
                    onClick={() => act(r, 'reject')}
                    className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                  >
                    <Shuffle size={14} /> Reject
                  </button>
                </div>
              </div>
            ))}
            {!loading && (reportsData?.data ?? []).length === 0 && (
              <div className="card text-slate-500">No {statusFilter.toLowerCase()} reports.</div>
            )}
          </div>
        </div>
      )}

      {tab === 'users' && (
        <div className="card">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase text-slate-400">
                <th className="py-2 pr-3">User</th>
                <th className="py-2 pr-3">Role</th>
                <th className="py-2 pr-3">Credibility</th>
                <th className="py-2 pr-3">Reports</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(usersData?.data ?? []).map((u) => (
                <tr key={u.id} className="border-b border-slate-50">
                  <td className="py-2 pr-3">
                    <p className="font-medium text-slate-900">{u.name ?? u.email.split('@')[0]}</p>
                    <p className="text-xs text-slate-400">{u.email}</p>
                  </td>
                  <td className="py-2 pr-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        u.role !== 'USER' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="py-2 pr-3">{u.credibilityScore}</td>
                  <td className="py-2 pr-3">{u._count?.reports ?? 0}</td>
                  <td className="py-2 pr-3">
                    {u.banned ? (
                      <span className="text-xs font-medium text-red-600">Banned</span>
                    ) : u.suspended ? (
                      <span className="text-xs font-medium text-amber-600">Suspended</span>
                    ) : (
                      <span className="text-xs font-medium text-emerald-600">Active</span>
                    )}
                  </td>
                  <td className="py-2 text-right">
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => userAction(u, 'suspend')}
                        className="rounded-lg border border-slate-200 p-1.5 text-amber-600 hover:bg-amber-50"
                        title="Suspend"
                      >
                        <UserMinus size={14} />
                      </button>
                      <button
                        disabled={u.banned}
                        onClick={() => userAction(u, 'ban')}
                        className="rounded-lg border border-slate-200 p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-30"
                        title="Ban"
                      >
                        <Ban size={14} />
                      </button>
                      {(u.suspended || u.banned) && (
                        <button
                          onClick={() => userAction(u, 'reactivate')}
                          className="rounded-lg border border-slate-200 p-1.5 text-emerald-600 hover:bg-emerald-50"
                          title="Reactivate"
                        >
                          <UserCheck size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'alerts' && <AlertsTab token={token} />}

      {tab === 'sync' && <SyncTab token={token} />}

      {tab === 'logs' && (
        <div className="card">
          <div className="space-y-2">
            {(logsData?.data ?? []).map((log) => (
              <div key={log.id} className="flex items-center justify-between gap-3 border-b border-slate-50 pb-2 last:border-0">
                <div>
                  <p className="text-sm font-medium text-slate-900">{log.action}</p>
                  <p className="text-xs text-slate-400">
                    {log.actor ? `${log.actor.name ?? log.actor.email}` : 'system'} · {log.targetType ?? ''}{' '}
                    {log.targetId ? `#${log.targetId.slice(0, 8)}` : ''}
                  </p>
                </div>
                <span className="text-xs text-slate-400">{timeAgo(log.createdAt)}</span>
              </div>
            ))}
            {(logsData?.data ?? []).length === 0 && (
              <p className="text-sm text-slate-500">No audit entries yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}