'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ArrowRight, CloudLightning, MapPin, ShieldCheck, Users } from 'lucide-react';
import { useGet } from '@/hooks/useApi';
import type { AlertItem, OverviewStats, Paginated, Report } from '@/lib/types';
import ReportCard from '@/components/ReportCard';

const WeatherMap = dynamic(() => import('@/components/WeatherMap'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[420px] items-center justify-center text-slate-400">
      Loading map…
    </div>
  ),
});

const STATS_KEY = 'stats';

export default function HomePage() {
  const { data: reports } = useGet<Paginated<Report>>('/api/reports?limit=6');
  const { data: overview } = useGet<OverviewStats>('/api/analytics/overview');
  const { data: alerts } = useGet<AlertItem[]>('/api/alerts');

  const recent = reports?.data ?? [];
  const topAlerts = (alerts ?? []).slice(0, 3);

  const stats = [
    { label: 'Total Reports', value: overview?.totalReports ?? '—' },
    { label: 'Verified Reports', value: overview?.verifiedReports ?? '—' },
    { label: 'Pending Review', value: overview?.pendingReports ?? '—' },
    { label: 'Active Alerts', value: overview?.activeAlerts ?? '—' },
  ];

  return (
    <div>
      <section className="relative overflow-hidden bg-brand-950 py-16 text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_70%_20%,rgba(51,143,255,0.35),transparent)]" />
        <div className="relative mx-auto max-w-7xl px-4">
          <div className="max-w-2xl">
            <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-black">
              <CloudLightning size={14} /> National Weather Intelligence Platform
            </p>
            <h1 className="text-4xl font-bold leading-tight sm:text-5xl text-black">
              AI-powered weather reporting &amp; verification
            </h1>
            <p className="mt-4 text-lg text-slate-700">
              MausamNet-AI fuses official weather APIs, citizen reports and
              internet sources, classifies events with machine learning, detects
              duplicates and misinformation, and visualizes trusted weather
              intelligence on an interactive map.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/map"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-brand-800 hover:bg-brand-50"
              >
                <MapPin size={18} /> Explore live map
              </Link>
              <Link
                href="/report/new"
                className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-3 font-semibold text-white hover:bg-brand-400"
              >
                <Users size={18} /> Submit a weather report
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto -mt-8 max-w-7xl px-4">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="card">
              <div className="text-2xl font-bold text-slate-900">{s.value}</div>
              <div className="text-sm text-slate-500">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Live weather map</h2>
        <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
          <WeatherMap reports={recent} height="420px" />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">Recent reports</h2>
          <Link
            href="/reports"
            className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:text-brand-800"
          >
            View all <ArrowRight size={16} />
          </Link>
        </div>
        {recent.length === 0 && !reports && (
          <div className="card text-slate-400">
            Loading reports or the API is not running.
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recent.map((r) => (
            <ReportCard key={r.id} report={r} />
          ))}
        </div>
      </section>

      {topAlerts.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-12">
          <h2 className="mb-4 text-2xl font-bold text-slate-900">Active warnings</h2>
          <div className="grid gap-3">
            {topAlerts.map((a) => (
              <div key={a.id} className="card flex items-start gap-3 border-red-200 bg-red-50/60">
                <span className="text-xl">⚠️</span>
                <div>
                  <p className="font-semibold text-slate-900">{a.title}</p>
                  <p className="text-sm text-slate-600">{a.message}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {[a.city, a.state].filter(Boolean).join(', ') || 'Nationwide'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="bg-slate-900 py-12 text-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:grid-cols-3">
          <div>
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500">
              <CloudLightning size={20} />
            </div>
            <h3 className="font-semibold">AI classification</h3>
            <p className="mt-1 text-sm text-slate-300">
              Every report is automatically classified into a weather event with a
              confidence score.
            </p>
          </div>
          <div>
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500">
              <ShieldCheck size={20} />
            </div>
            <h3 className="font-semibold">Credibility scoring</h3>
            <p className="mt-1 text-sm text-slate-300">
              Duplicate detection, evidence weighting and user trust combine into a
              credibility score.
            </p>
          </div>
          <div>
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500">
              <Users size={20} />
            </div>
            <h3 className="font-semibold">Human verification</h3>
            <p className="mt-1 text-sm text-slate-300">
              Administrators review and verify reports before they become trusted
              weather data.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}