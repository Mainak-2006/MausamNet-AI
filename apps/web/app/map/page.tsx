'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { useGet } from '@/hooks/useApi';
import type { Paginated, Report } from '@/lib/types';
import { EVENT_CATEGORIES, categoryStyle } from '@/lib/constants';

const WeatherMap = dynamic(() => import('@/components/WeatherMap'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[70vh] items-center justify-center text-slate-400">
      Loading map…
    </div>
  ),
});

export default function MapPage() {
  const { data, loading } = useGet<Paginated<Report>>('/api/reports?limit=100');
  const [category, setCategory] = useState<string>('ALL');
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const reports = (data?.data ?? []).filter((r) => {
    if (category !== 'ALL' && r.category !== category) return false;
    if (verifiedOnly && r.status !== 'VERIFIED') return false;
    return true;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Live weather map</h1>
          <p className="text-sm text-slate-500">
            Weather events reported across India ·{' '}
            {loading ? '…' : `${reports.length} markers`}
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={verifiedOnly}
            onChange={(e) => setVerifiedOnly(e.target.checked)}
            className="h-4 w-4 accent-brand-600"
          />
          Verified only
        </label>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => setCategory('ALL')}
          className={`rounded-full px-3 py-1.5 text-xs font-medium ${
            category === 'ALL'
              ? 'bg-brand-600 text-white'
              : 'bg-white text-slate-600 ring-1 ring-slate-200'
          }`}
        >
          All
        </button>
        {EVENT_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat === category ? 'ALL' : cat)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              category === cat
                ? 'bg-brand-600 text-white'
                : 'bg-white text-slate-600 ring-1 ring-slate-200'
            }`}
          >
            {categoryStyle(cat).emoji} {categoryStyle(cat).label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
        <WeatherMap reports={reports} height="70vh" />
      </div>
    </div>
  );
}