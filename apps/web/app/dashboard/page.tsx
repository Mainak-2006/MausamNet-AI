'use client';

import Link from 'next/link';
import { Bell, BellRing, CheckCircle2, Clock, FileText, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/components/AuthContext';
import { useGet } from '@/hooks/useApi';
import type { AlertItem, OverviewStats, Report } from '@/lib/types';
import { categoryStyle, timeAgo } from '@/lib/constants';
import { StatusBadge, SeverityBadge, CategoryIcon } from '@/components/badges';
import WeatherWidget from '@/components/WeatherWidget';

export default function DashboardPage() {
  const { user, session, isLoading } = useAuth();
  const token = session?.access_token;

  const { data: stats } = useGet<OverviewStats>('/api/analytics/overview');
  const { data: myReports } = useGet<Report[]>('/api/users/me/reports', token);
  const { data: alerts } = useGet<AlertItem[]>('/api/alerts');

  const cards = [
    { label: 'My reports', value: myReports?.length ?? '—' },
    { label: 'Verified reports', value: stats?.verifiedReports ?? '—' },
    { label: 'Pending review', value: stats?.pendingReports ?? '—' },
    { label: 'Active alerts', value: stats?.activeAlerts ?? '—' },
  ];

  if (isLoading) {
    return <div className="mx-auto max-w-7xl px-4 py-10 text-slate-400">Loading…</div>;
  }

  if (!user) {
    return <div className="mx-auto max-w-7xl px-4 py-10 text-slate-500">Please log in.</div>;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome, {user.name ?? user.email.split('@')[0]}
        </h1>
        <p className="text-sm text-slate-500">
          Reporter credibility:{' '}
          <span className="font-semibold text-emerald-600">{user.credibilityScore}/100</span>
        </p>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="card">
            <div className="text-2xl font-bold text-slate-900">{c.value}</div>
            <div className="text-sm text-slate-500">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold text-slate-900">
              <FileText size={18} className="text-brand-600" /> My reports
            </h2>
            <Link href="/report/new" className="text-sm font-medium text-brand-700 hover:underline">
              + New report
            </Link>
          </div>
          <div className="space-y-3">
            {myReports && myReports.length === 0 && (
              <div className="card text-slate-500">
                You haven&apos;t submitted any reports yet.
              </div>
            )}
            {myReports?.map((r) => (
              <Link key={r.id} href={`/reports/${r.id}`} className="card block hover:border-brand-300">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CategoryIcon category={r.category} size={16} />
                    <span className="font-medium text-slate-900">{r.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={r.status} />
                    <SeverityBadge severity={r.severity} />
                  </div>
                </div>
                <div className="mt-1 flex justify-between text-xs text-slate-400">
                  <span>{categoryStyle(r.category).label}</span>
                  <span>{timeAgo(r.reportedAt)}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <WeatherWidget initialCity={user.city ?? 'Siliguri'} />

          <div>
            <h2 className="mb-3 flex items-center gap-2 font-semibold text-slate-900">
              <BellRing size={18} className="text-amber-500" /> Alerts
            </h2>
            <div className="space-y-2">
              {alerts && alerts.length === 0 && (
                <div className="card text-sm text-slate-500">No active alerts.</div>
              )}
              {alerts?.map((a) => (
                <div key={a.id} className="card flex items-start gap-3">
                  <ShieldAlert size={16} className="mt-0.5 shrink-0 text-amber-600" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">{a.title}</p>
                    <p className="text-xs text-slate-500">
                      {a.city} · {a.severity}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}