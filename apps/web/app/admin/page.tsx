'use client';

import { useEffect, useState } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import PendingReportsTable from '../../components/admin/PendingReportsTable';
import AuthGuard from '../../components/auth/AuthGuard';
import { apiGet } from '../../lib/api';
import type { Alert, PaginatedReports, Report } from '../../lib/api/types';

export default function AdminPage() {
  const [pending, setPending] = useState<Report[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const reload = () => setRefreshKey((k) => k + 1);

  useEffect(() => {
    let active = true;
    Promise.all([
      apiGet<PaginatedReports>('/api/reports', {
        limit: 50,
        verificationStatus: 'pending',
      }),
      apiGet<Alert[]>('/api/alerts'),
    ])
      .then(([reportsRes, alertsRes]) => {
        if (active) {
          setPending(reportsRes.data);
          setAlerts(alertsRes);
          setError(null);
        }
      })
      .catch((err) => {
        if (active) setError((err as { message?: string }).message ?? 'Failed to load admin data');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [refreshKey]);

  return (
    <AuthGuard adminOnly>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin panel</h1>
          <p className="text-sm text-gray-500">
            Review pending reports, verify reports, and manage alerts.
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-16 text-center text-sm text-gray-500">Loading…</div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <h2 className="mb-3 text-lg font-semibold text-gray-900">
                Pending review ({pending.length})
              </h2>
              <PendingReportsTable reports={pending} onReload={reload} />
            </div>
            <div>
              <AdminSidebar alerts={alerts} onChanged={reload} />
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}