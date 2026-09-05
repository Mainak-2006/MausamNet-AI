'use client';

import { useEffect, useMemo, useState } from 'react';
import AuthGuard from '../../components/auth/AuthGuard';
import AlertBanner from '../../components/dashboard/AlertBanner';
import EventDistributionChart from '../../components/dashboard/EventDistributionChart';
import RecentReports from '../../components/dashboard/RecentReports';
import StatCard from '../../components/dashboard/StatCard';
import WeatherWidget from '../../components/weather/WeatherWidget';
import { apiGet } from '../../lib/api';
import type { Alert, PaginatedReports, Report } from '../../lib/api/types';

export default function DashboardPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // filters
  const [eventType, setEventType] = useState('');
  const [verificationStatus, setVerificationStatus] = useState('');

  useEffect(() => {
    let active = true;
    apiGet<PaginatedReports>('/api/reports', {
      limit: 5,
      page: 1,
      eventType: eventType || undefined,
      verificationStatus: verificationStatus || undefined,
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
  }, [eventType, verificationStatus]);

  useEffect(() => {
    apiGet<Alert[]>('/api/alerts')
      .then(setAlerts)
      .catch(() => setAlerts([]));
  }, []);

  const distribution = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of reports) {
      counts.set(r.eventType, (counts.get(r.eventType) ?? 0) + 1);
    }
    return Array.from(counts, ([name, value]) => ({ name, value }));
  }, [reports]);

  const verified = reports.filter(
    (r) => r.verificationStatus === 'verified',
  ).length;
  const pending = reports.filter(
    (r) => r.verificationStatus === 'pending',
  ).length;

  return (
    <AuthGuard>
      <div className="space-y-8">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500">
              Live summary of weather reports and alerts across India.
            </p>
          </div>
          <div className="flex gap-3">
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">All event types</option>
              <option value="rainfall">Rainfall</option>
              <option value="flood">Flood</option>
              <option value="thunderstorm">Thunderstorm</option>
              <option value="heatwave">Heatwave</option>
              <option value="strong_wind">Strong wind</option>
              <option value="cyclone">Cyclone</option>
              <option value="drought">Drought</option>
              <option value="other">Other</option>
            </select>
            <select
              value={verificationStatus}
              onChange={(e) => setVerificationStatus(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="unverified">Unverified</option>
              <option value="suspicious">Suspicious</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div>
          <WeatherWidget />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total reports" value={loading ? '…' : reports.length} color="text-blue-600" />
          <StatCard
            label="Verified"
            value={loading ? '…' : verified}
            color="text-green-600"
          />
          <StatCard
            label="Pending review"
            value={loading ? '…' : pending}
            color="text-yellow-600"
          />
          <StatCard
            label="Active alerts"
            value={alerts.length}
            color="text-red-600"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
            <h2 className="text-lg font-semibold text-gray-900">Recent reports</h2>
            <div className="mt-4">
              <RecentReports reports={reports} />
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Event distribution</h2>
            <div className="mt-4">
              <EventDistributionChart data={distribution} />
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900">Active alerts</h2>
          <div className="mt-4">
            <AlertBanner alerts={alerts} />
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}