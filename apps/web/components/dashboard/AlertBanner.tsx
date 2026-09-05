'use client';

import Link from 'next/link';
import type { Alert } from '../../lib/api/types';

function severityClasses(severity: Alert['severity']): string {
  switch (severity) {
    case 'critical':
      return 'border-red-600 bg-red-50 text-red-800';
    case 'high':
      return 'border-orange-400 bg-orange-50 text-orange-800';
    case 'medium':
      return 'border-yellow-400 bg-yellow-50 text-yellow-800';
    default:
      return 'border-blue-300 bg-blue-50 text-blue-800';
  }
}

export default function AlertBanner({ alerts }: { alerts: Alert[] }) {
  if (alerts.length === 0) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
        No active alerts right now.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {alerts.map((alert) => (
        <Link
          key={alert.id}
          href={`/reports/${alert.reportId}`}
          className={`block rounded-xl border px-4 py-3 shadow-sm ${severityClasses(alert.severity)}`}
        >
          <div className="flex items-center justify-between gap-3">
            <p className="font-semibold">{alert.title}</p>
            <span className="shrink-0 rounded-md bg-white/60 px-2 py-0.5 text-xs font-medium uppercase">
              {alert.severity}
            </span>
          </div>
          <p className="mt-1 line-clamp-2 text-sm opacity-90">{alert.message}</p>
        </Link>
      ))}
    </div>
  );
}