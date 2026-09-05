'use client';

import { useState } from 'react';
import { apiPatch } from '../../lib/api';
import type { Alert } from '../../lib/api/types';

export default function AdminSidebar({
  alerts,
  onChanged,
}: {
  alerts: Alert[];
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);

  const dismiss = async (id: string) => {
    setBusy(id);
    try {
      await apiPatch(`/api/alerts/${id}`, { isActive: false });
      onChanged();
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-gray-900">Active alerts</h2>
        {alerts.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">No active alerts.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {alerts.map((alert) => (
              <li key={alert.id} className="rounded-lg border border-gray-200 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="line-clamp-1 text-sm font-medium text-gray-800">
                    {alert.title}
                  </p>
                  <span className="shrink-0 rounded bg-gray-100 px-2 py-0.5 text-xs font-medium uppercase text-gray-600">
                    {alert.severity}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-gray-500">{alert.message}</p>
                <button
                  onClick={() => dismiss(alert.id)}
                  disabled={busy === alert.id}
                  className="mt-2 w-full rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                >
                  {busy === alert.id ? 'Dismissing…' : 'Dismiss alert'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}