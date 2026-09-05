'use client';

import type { AlertSeverity } from '@mausamnet/shared';
import { useEffect, useMemo, useState } from 'react';
import AlertCard from '../../components/alerts/AlertCard';
import AlertFilters from '../../components/alerts/AlertFilters';
import AuthGuard from '../../components/auth/AuthGuard';
import { apiGet } from '../../lib/api';
import type { Alert } from '../../lib/api/types';

const SEVERITY_ORDER: Record<AlertSeverity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [severity, setSeverity] = useState<AlertSeverity | ''>('');

  useEffect(() => {
    let active = true;
    apiGet<Alert[]>('/api/alerts')
      .then((data) => {
        if (active) {
          setAlerts(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (active) setError((err as { message?: string }).message ?? 'Failed to load alerts');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const list = severity ? alerts.filter((a) => a.severity === severity) : alerts;
    return [...list].sort((a, b) => {
      const bySeverity = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
      if (bySeverity !== 0) return bySeverity;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [alerts, severity]);

  return (
    <AuthGuard>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alerts</h1>
          <p className="text-sm text-gray-500">
            Active weather alerts ranked by severity.
          </p>
        </div>

        <AlertFilters severity={severity} onSeverity={setSeverity} />

        {error && (
          <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-16 text-center text-sm text-gray-500">Loading alerts…</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white py-16 text-center text-sm text-gray-500">
            No active alerts.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filtered.map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </div>
        )}
      </div>
    </AuthGuard>
  );
}