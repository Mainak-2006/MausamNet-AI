'use client';

import { useEffect } from 'react';
import { useWeather } from '../../hooks/use-weather';
import WeatherCurrentCard from './WeatherCurrentCard';

interface WeatherWidgetProps {
  city?: string;
}

export default function WeatherWidget({ city = 'Delhi' }: WeatherWidgetProps) {
  const { data, loading, error, query, setQuery: load } = useWeather({ city });

  useEffect(() => {
    if (query?.city !== city) {
      load({ city });
    }
  }, [city, query, load]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Live weather</h2>
        <button
          onClick={() => load({ city })}
          disabled={loading}
          className="rounded-md border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
        >
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      {loading && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Loading weather…</p>
        </div>
      )}

      {error && !loading && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && data && <WeatherCurrentCard data={data} compact />}
    </div>
  );
}