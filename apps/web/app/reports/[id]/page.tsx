'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import AuthGuard from '../../../components/auth/AuthGuard';
import ReportDetail from '../../../components/reports/ReportDetail';
import { apiGet } from '../../../lib/api';
import type { Report } from '../../../lib/api/types';

export default function ReportDetailPage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : '';
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let active = true;
    apiGet<Report>(`/api/reports/${id}`)
      .then((data) => {
        if (active) {
          setReport(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (active) setError((err as { message?: string }).message ?? 'Report not found');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  return (
    <AuthGuard>
      <div className="space-y-6">
        <Link
          href="/reports"
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          ← Back to reports
        </Link>

        {loading && (
          <div className="rounded-xl border border-gray-200 bg-white py-16 text-center text-sm text-gray-500">
            Loading report…
          </div>
        )}

        {error && (
          <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {report && <ReportDetail report={report} />}
      </div>
    </AuthGuard>
  );
}