'use client';

import type { AlertSeverity } from '@mausamnet/shared';

interface AlertFiltersProps {
  severity: AlertSeverity | '';
  onSeverity: (value: AlertSeverity | '') => void;
}

export default function AlertFilters({ severity, onSeverity }: AlertFiltersProps) {
  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div>
        <label className="block text-xs font-medium text-gray-500">Severity</label>
        <select
          value={severity}
          onChange={(e) => onSeverity(e.target.value as AlertSeverity | '')}
          className="mt-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">All severities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
      </div>
    </div>
  );
}