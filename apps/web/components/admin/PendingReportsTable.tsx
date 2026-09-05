'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { Report } from '../../lib/api/types';
import CredibilityDisplay, { ReportTypeChip } from './CredibilityDisplay';
import VerificationModal from './VerificationModal';

export default function PendingReportsTable({
  reports,
  onReload,
}: {
  reports: Report[];
  onReload: () => void;
}) {
  const [selected, setSelected] = useState<Report | null>(null);

  if (reports.length === 0) {
    return (
      <p className="rounded-xl border border-gray-200 bg-white py-12 text-center text-sm text-gray-500">
        No pending reports awaiting review.
      </p>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Report
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Event
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Location
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Credibility
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Date
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {reports.map((report) => (
              <tr key={report.id} className="hover:bg-gray-50">
                <td className="max-w-xs px-4 py-3">
                  <Link
                    href={`/reports/${report.id}`}
                    className="line-clamp-1 font-medium text-gray-900 hover:text-blue-700"
                  >
                    {report.title}
                  </Link>
                  <p className="line-clamp-1 text-xs text-gray-500">
                    {report.description}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <ReportTypeChip eventType={report.eventType} />
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {report.city}, {report.state}
                </td>
                <td className="px-4 py-3">
                  <CredibilityDisplay score={report.credibilityScore} />
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {new Date(report.reportDate).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => setSelected(report)}
                    className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
                  >
                    Review
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <VerificationModal
          report={selected}
          onClose={() => setSelected(null)}
          onVerified={onReload}
        />
      )}
    </>
  );
}