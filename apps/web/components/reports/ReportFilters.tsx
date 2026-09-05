'use client';

import type { ReportFilters } from '../../lib/api/types';

interface ReportFiltersProps {
  filters: ReportFilters;
  onChange: (filters: ReportFilters) => void;
}

export default function ReportFilters({ filters, onChange }: ReportFiltersProps) {
  const update = (patch: Partial<ReportFilters>) =>
    onChange({ ...filters, ...patch, page: 1 });

  return (
    <div className="grid gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
      <div>
        <label className="block text-xs font-medium text-gray-500">Event type</label>
        <select
          value={filters.eventType ?? ''}
          onChange={(e) =>
            update({ eventType: (e.target.value || undefined) as ReportFilters['eventType'] })
          }
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
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
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500">
          Verification status
        </label>
        <select
          value={filters.verificationStatus ?? ''}
          onChange={(e) =>
            update({
              verificationStatus:
                (e.target.value || undefined) as ReportFilters['verificationStatus'],
            })
          }
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
          <option value="unverified">Unverified</option>
          <option value="suspicious">Suspicious</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500">City</label>
        <input
          type="text"
          value={filters.city ?? ''}
          onChange={(e) => update({ city: e.target.value || undefined })}
          placeholder="e.g. Chennai"
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500">State</label>
        <input
          type="text"
          value={filters.state ?? ''}
          onChange={(e) => update({ state: e.target.value || undefined })}
          placeholder="e.g. Tamil Nadu"
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500">Date from</label>
        <input
          type="date"
          value={filters.dateFrom ?? ''}
          onChange={(e) => update({ dateFrom: e.target.value || undefined })}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500">Date to</label>
        <input
          type="date"
          value={filters.dateTo ?? ''}
          onChange={(e) => update({ dateTo: e.target.value || undefined })}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500">Sort by</label>
        <select
          value={filters.sortBy ?? 'createdAt'}
          onChange={(e) => update({ sortBy: e.target.value })}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="createdAt">Created date</option>
          <option value="reportDate">Report date</option>
          <option value="credibilityScore">Credibility</option>
          <option value="title">Title</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500">Order</label>
        <select
          value={filters.sortOrder ?? 'DESC'}
          onChange={(e) =>
            update({ sortOrder: e.target.value as 'ASC' | 'DESC' })
          }
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="DESC">Newest first</option>
          <option value="ASC">Oldest first</option>
        </select>
      </div>
    </div>
  );
}