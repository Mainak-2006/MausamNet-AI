'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import AuthGuard from '../../components/auth/AuthGuard';
import MapFilters from '../../components/map/MapFilters';
import WeatherWidget from '../../components/weather/WeatherWidget';
import { apiGet } from '../../lib/api';
import type { PaginatedReports, Report } from '../../lib/api/types';

const ReportMap = dynamic(
  () => import('../../components/map/ReportMap'),
  { ssr: false },
);

export default function MapPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eventType, setEventType] = useState('');
  const [city, setCity] = useState('');
  const [heatmap, setHeatmap] = useState(false);
  const [showWeather, setShowWeather] = useState(false);

  useEffect(() => {
    let active = true;
    apiGet<PaginatedReports>('/api/reports', {
      limit: 200,
      page: 1,
      eventType: eventType || undefined,
      city: city || undefined,
    })
      .then((res) => {
        if (active) {
          setReports(res.data);
          setError(null);
        }
      })
      .catch((err) => {
        if (active) setError((err as { message?: string }).message ?? 'Failed to load reports');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [eventType, city]);

  return (
    <AuthGuard>
      <div className="space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Weather Map</h1>
            <p className="text-sm text-gray-500">
              Interactive map of weather events across India.
            </p>
          </div>
        </div>

        <MapFilters
          eventType={eventType}
          onEventType={setEventType}
          city={city}
          onCity={setCity}
          heatmap={heatmap}
          onHeatmap={setHeatmap}
        />

        <div className="flex justify-end">
          <button
            onClick={() => setShowWeather((v) => !v)}
            className={`rounded-md border px-3 py-2 text-sm font-medium ${
              showWeather
                ? 'border-blue-600 bg-blue-600 text-white hover:bg-blue-700'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            {showWeather ? 'Hide live weather' : 'Show live weather'}
          </button>
        </div>

        {showWeather && (
          <div>
            <WeatherWidget city={city || 'Delhi'} />
          </div>
        )}

        {error && (
          <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex h-[520px] items-center justify-center rounded-xl border border-gray-200 bg-white">
            <p className="text-sm text-gray-500">Loading map…</p>
          </div>
        ) : (
          <ReportMap reports={reports} center={null} heatmap={heatmap} />
        )}

        <p className="text-sm text-gray-500">
          Showing {reports.length} report{reports.length === 1 ? '' : 's'}
          {eventType && ` · ${eventType}`}
          {city && ` · ${city}`}
        </p>
      </div>
    </AuthGuard>
  );
}