'use client';

import { useEffect, useState } from 'react';
import AuthGuard from '../../components/auth/AuthGuard';
import Pagination from '../../components/reports/Pagination';
import ReportCard from '../../components/reports/ReportCard';
import ReportFilters from '../../components/reports/ReportFilters';
import { apiGet } from '../../lib/api';
import type { PaginatedReports, Report, ReportFilters as Filters } from '../../lib/api/types';

const DEFAULT_FILTERS: Filters = {
  page: 1,
  limit: 12,
  sortBy: 'createdAt',
  sortOrder: 'DESC',
};

export default function ReportsPage() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [data, setData] = useState<PaginatedReports | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    apiGet<PaginatedReports>('/api/reports', filters)
      .then((res) => {
        if (active) {
          setData(res);
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
  }, [filters]);

  return (
    <AuthGuard>
      <div className="space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
            <p className="text-sm text-gray-500">
              Browse community weather reports with advanced filtering.
            </p>
          </div>
        </div>

        <ReportFilters filters={filters} onChange={setFilters} />

        {error && (
          <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-16 text-center text-sm text-gray-500">Loading reports…</div>
        ) : data && data.data.length > 0 ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {data.data.map((report: Report) => (
                <ReportCard key={report.id} report={report} />
              ))}
            </div>
            <Pagination
              page={data.page}
              totalPages={data.totalPages}
              total={data.total}
              onPage={(page) => setFilters((f) => ({ ...f, page }))}
            />
          </>
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white py-16 text-center text-sm text-gray-500">
            No reports match your filters.
          </div>
        )}
      </div>
    </AuthGuard>
  );
}