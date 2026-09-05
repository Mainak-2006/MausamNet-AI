'use client';

import Link from 'next/link';
import type { Alert } from '../../lib/api/types';

function severityClasses(severity: Alert['severity']): string {
  switch (severity) {
    case 'critical':
      return 'border-red-600 bg-red-50';
    case 'high':
      return 'border-orange-400 bg-orange-50';
    case 'medium':
      return 'border-yellow-400 bg-yellow-50';
    default:
      return 'border-blue-300 bg-blue-50';
  }
}

function severityText(severity: Alert['severity']): string {
  switch (severity) {
    case 'critical':
      return 'text-red-800';
    case 'high':
      return 'text-orange-800';
    case 'medium':
      return 'text-yellow-800';
    default:
      return 'text-blue-800';
  }
}

export default function AlertCard({ alert }: { alert: Alert }) {
  return (
    <div
      className={`rounded-xl border p-5 shadow-sm ${severityClasses(alert.severity)}`}
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-semibold text-gray-900">{alert.title}</h2>
        <span
          className={`shrink-0 rounded-md bg-white/70 px-2 py-0.5 text-xs font-medium uppercase ${severityText(alert.severity)}`}
        >
          {alert.severity}
        </span>
      </div>
      <p className="mt-2 text-sm text-gray-800">{alert.message}</p>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-600">
        <span className="capitalize">{alert.eventType}</span>
        <span className="flex items-center gap-3">
          <span>{new Date(alert.createdAt).toLocaleString()}</span>
          {alert.report && (
            <Link
              href={`/reports/${alert.reportId}`}
              className="font-medium text-gray-800 underline hover:text-gray-900"
            >
              View report
            </Link>
          )}
        </span>
      </div>
    </div>
  );
}