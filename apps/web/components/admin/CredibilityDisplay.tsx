'use client';

import { eventTagColor } from '../../lib/format';
import type { Report } from '../../lib/api/types';

export default function CredibilityDisplay({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color = pct >= 70 ? 'bg-green-500' : pct >= 40 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-200">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-medium text-gray-700">{pct}/100</span>
    </div>
  );
}

export function ReportTypeChip({ eventType }: { eventType: Report['eventType'] }) {
  const color = eventTagColor(eventType);
  return (
    <span
      className="rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ color, backgroundColor: `${color}1a` }}
    >
      {eventType}
    </span>
  );
}