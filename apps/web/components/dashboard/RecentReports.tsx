'use client';

import Link from 'next/link';
import { eventTagColor } from '../../lib/format';
import type { Report } from '../../lib/api/types';

export default function RecentReports({ reports }: { reports: Report[] }) {
  if (reports.length === 0) {
    return <p className="py-8 text-center text-sm text-gray-500">No recent reports</p>;
  }

  return (
    <ul className="divide-y divide-gray-200">
      {reports.map((report) => (
        <li key={report.id} className="py-3">
          <Link
            href={`/reports/${report.id}`}
            className="group flex items-start justify-between gap-4"
          >
            <div className="min-w-0">
              <p className="truncate font-medium text-gray-900 group-hover:text-blue-700">
                {report.title}
              </p>
              <p className="mt-0.5 truncate text-sm text-gray-500">
                {report.city}, {report.state} ·{' '}
                {new Date(report.reportDate).toLocaleDateString()}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span
                className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                style={{
                  color: eventTagColor(report.eventType),
                  backgroundColor: `${eventTagColor(report.eventType)}1a`,
                }}
              >
                {report.eventType}
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}