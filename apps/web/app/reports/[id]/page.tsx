'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ArrowLeft, Bot, DownloadCloud, MapPin, ShieldCheck } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useGet } from '@/hooks/useApi';
import type { Report } from '@/lib/types';
import { categoryStyle, timeAgo } from '@/lib/constants';
import {
  StatusBadge,
  SeverityBadge,
  CredibilityMeter,
  CategoryIcon,
} from '@/components/badges';
import ReportAdminActions from '@/components/ReportAdminActions';

const WeatherMap = dynamic(() => import('@/components/WeatherMap'), {
  ssr: false,
  loading: () => (
    <div className="flex h-64 items-center justify-center text-slate-400">Loading map…</div>
  ),
});

export default function ReportDetailPage() {
  const params = useParams<{ id: string }>();
  const { data: report, loading, error, reload } = useGet<Report>(`/api/reports/${params.id}`);

  if (loading && !report) {
    return <div className="mx-auto max-w-4xl px-4 py-10 text-slate-400">Loading report…</div>;
  }

  if (error || !report) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <p className="text-red-600">{error ?? 'Report not found'}</p>
        <Link href="/reports" className="text-sm text-brand-700 hover:underline">
          ← Back to reports
        </Link>
      </div>
    );
  }

  const cat = categoryStyle(report.category);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link
        href="/reports"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-brand-700"
      >
        <ArrowLeft size={16} /> Back to reports
      </Link>

      <div className="card p-6">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <CategoryIcon category={report.category} size={20} />
          <span className="font-medium text-slate-700">{cat.label}</span>
          <StatusBadge status={report.status} />
          <SeverityBadge severity={report.severity} />
          {report.isDuplicate && (
            <span className="inline-flex items-center rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700">
              Possible duplicate
            </span>
          )}
        </div>

        <h1 className="text-2xl font-bold text-slate-900">{report.title}</h1>
        {report.description && (
          <p className="mt-3 whitespace-pre-wrap text-slate-700">{report.description}</p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-500">
          <span className="flex items-center gap-1">
            <MapPin size={14} />
            {[report.city, report.state].filter(Boolean).join(', ') || 'Unknown location'}
          </span>
          <span>Reported {timeAgo(report.reportedAt)}</span>
          {report.latitude != null && report.longitude != null && (
            <span className="font-mono text-xs">
              {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}
            </span>
          )}
        </div>

        {report.author && (
          <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-4 text-sm">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-700">
              {(report.author.name ?? 'U').slice(0, 1).toUpperCase()}
            </span>
            <div>
              <p className="font-medium text-slate-800">
                {report.author.name ?? 'Anonymous citizen'}
              </p>
              <p className="text-xs text-slate-500">
                Reporter credibility {report.author.credibilityScore}/100
              </p>
            </div>
          </div>
        )}
      </div>

      <ReportAdminActions report={report} onChanged={reload} />

      <div className="mt-4 card p-6">
        <h2 className="mb-3 flex items-center gap-2 font-semibold text-slate-900">
          <Bot size={18} className="text-brand-600" /> AI analysis
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs text-slate-500">Predicted event</p>
            <p className="mt-1 font-semibold text-slate-900">
              {cat.label}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs text-slate-500">AI confidence</p>
            <p className="mt-1 font-semibold text-slate-900">
              {report.aiConfidence != null
                ? `${Math.round(report.aiConfidence * 100)}%`
                : '—'}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs text-slate-500">Report source</p>
            <p className="mt-1 font-semibold text-slate-900">Citizen</p>
          </div>
        </div>
      </div>

      <div className="mt-4 card p-6">
        <h2 className="mb-3 flex items-center gap-2 font-semibold text-slate-900">
          <ShieldCheck size={18} className="text-emerald-600" /> Credibility
        </h2>
        <div className="flex items-center gap-6">
          <div className="text-3xl font-bold text-slate-900">
            {report.credibilityScore}
            <span className="text-lg text-slate-400">/100</span>
          </div>
          <div className="flex-1">
            <CredibilityMeter score={report.credibilityScore} />
            <p className="mt-2 text-xs text-slate-500">
              Based on AI confidence, evidence, location accuracy, duplicate
              corroboration and reporter history.
            </p>
          </div>
        </div>
      </div>

      {report.media.length > 0 && (
        <div className="mt-4 card p-6">
          <h2 className="mb-3 flex items-center gap-2 font-semibold text-slate-900">
            <DownloadCloud size={18} className="text-brand-600" /> Evidence
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {report.media.map((m) =>
              m.type === 'VIDEO' ? (
                <video key={m.id} src={m.url} controls className="h-40 w-full rounded-xl object-cover" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={m.id}
                  src={m.url}
                  alt="Weather evidence"
                  className="h-40 w-full rounded-xl object-cover"
                />
              ),
            )}
          </div>
        </div>
      )}

      {report.latitude != null && report.longitude != null && (
        <div className="mt-4 card overflow-hidden p-0">
          <WeatherMap
            reports={[report]}
            height="320px"
            center={[report.latitude, report.longitude]}
            zoom={12}
          />
        </div>
      )}

      {report.verificationNotes && (
        <div className="mt-4 card border-amber-200 bg-amber-50/60 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-amber-700">
            Verification notes
          </p>
          <p className="mt-1 text-sm text-slate-700">{report.verificationNotes}</p>
        </div>
      )}
    </div>
  );
}