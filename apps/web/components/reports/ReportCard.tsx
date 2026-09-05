'use client';

import Link from 'next/link';
import { eventTagColor } from '../../lib/format';
import type { Report } from '../../lib/api/types';

function verificationBadge(status: Report['verificationStatus']): string {
  switch (status) {
    case 'verified':
      return 'bg-green-100 text-green-800';
    case 'unverified':
      return 'bg-gray-100 text-gray-700';
    case 'suspicious':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-yellow-100 text-yellow-800';
  }
}

export default function ReportCard({ report }: { report: Report }) {
  const color = eventTagColor(report.eventType);
  return (
    <div className="flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <Link
          href={`/reports/${report.id}`}
          className="font-semibold text-gray-900 hover:text-blue-700"
        >
          {report.title}
        </Link>
        <span
          className="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium"
          style={{ color, backgroundColor: `${color}1a` }}
        >
          {report.eventType}
        </span>
      </div>
      <p className="mt-2 line-clamp-3 text-sm text-gray-600">{report.description}</p>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-gray-500">
        <span className="font-medium text-gray-700">
          {report.city}, {report.state}
        </span>
        <span>·</span>
        <span>{new Date(report.reportDate).toLocaleDateString()}</span>
        <span className="ml-auto">
          <span
            className={`rounded-full px-2 py-0.5 font-medium ${verificationBadge(report.verificationStatus)}`}
          >
            {report.verificationStatus}
          </span>
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
        <span>Credibility: {Math.round(report.credibilityScore * 100)}/100</span>
        {report.user && <span className="truncate">By {report.user.name}</span>}
      </div>
    </div>
  );
}