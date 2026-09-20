'use client';

import { FormEvent, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { useGet } from '@/hooks/useApi';
import type { Paginated, Report } from '@/lib/types';
import { EVENT_CATEGORIES, REPORT_STATUSES, categoryStyle } from '@/lib/constants';
import ReportCard from '@/components/ReportCard';
import ReportAdminActions from '@/components/ReportAdminActions';

function buildQuery(params: URLSearchParams) {
  const parts: string[] = [];
  for (const [key, value] of Array.from(params.entries())) {
    if (value) parts.push(`${key}=${encodeURIComponent(value)}`);
  }
  return `/api/reports${parts.length ? `?${parts.join('&')}` : ''}`;
}

export default function ReportsBrowser() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [search, setSearch] = useState(searchParams.get('q') ?? '');

  const path = buildQuery(searchParams);
  const { data, loading, reload } = useGet<Paginated<Report>>(path);
  const reports = data?.data ?? [];
  const meta = data?.meta;

  const updateParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.set('page', '1');
    router.push(`/reports?${params.toString()}`);
  };

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    updateParams('q', search);
  };

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(page));
    router.push(`/reports?${params.toString()}`);
  };

  const selectedCategory = searchParams.get('category') ?? '';
  const selectedStatus = searchParams.get('status') ?? '';

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Weather reports</h1>
        <p className="text-sm text-slate-500">
          Citizen-reported and AI-verified weather events
        </p>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <form onSubmit={onSearch} className="flex flex-1 gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search: flood, Siliguri, cyclone…"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            <Search size={16} />
          </button>
        </form>
        <select
          value={selectedCategory}
          onChange={(e) => updateParams('category', e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
        >
          <option value="">All events</option>
          {EVENT_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {categoryStyle(c).label}
            </option>
          ))}
        </select>
        <select
          value={selectedStatus}
          onChange={(e) => updateParams('status', e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          {REPORT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {loading && !reports.length && (
        <div className="card text-slate-400">Loading reports…</div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reports.map((r) => (
          <div key={r.id} className="flex flex-col gap-2">
            <ReportCard report={r} />
            <ReportAdminActions report={r} onChanged={reload} compact />
          </div>
        ))}
      </div>

      {!loading && reports.length === 0 && (
        <div className="card text-center text-slate-500">
          No reports match your filters.
        </div>
      )}

      {meta && meta.pages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            disabled={meta.page <= 1}
            onClick={() => goToPage(meta.page - 1)}
            className="rounded-xl border border-slate-200 bg-white p-2 disabled:opacity-40"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm text-slate-600">
            Page {meta.page} of {meta.pages}
          </span>
          <button
            disabled={meta.page >= meta.pages}
            onClick={() => goToPage(meta.page + 1)}
            className="rounded-xl border border-slate-200 bg-white p-2 disabled:opacity-40"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}