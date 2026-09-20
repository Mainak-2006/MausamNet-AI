import Link from 'next/link';
import type { Report } from '@/lib/types';
import { categoryStyle, timeAgo } from '@/lib/constants';
import { StatusBadge, SeverityBadge, CredibilityMeter, CategoryIcon } from './badges';

export default function ReportCard({ report }: { report: Report }) {
  const cat = categoryStyle(report.category);
  return (
    <Link
      href={`/reports/${report.id}`}
      className="card group flex flex-col gap-3 transition hover:border-brand-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <CategoryIcon category={report.category} size={18} />
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {cat.label}
          </span>
        </div>
        <StatusBadge status={report.status} />
      </div>

      <h3 className="font-semibold text-slate-900 group-hover:text-brand-700">
        {report.title}
      </h3>
      {report.description && (
        <p className="line-clamp-2 text-sm text-slate-600">{report.description}</p>
      )}

      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          📍 {[report.city, report.state].filter(Boolean).join(', ') || 'Unknown'}
        </span>
        <span>{timeAgo(report.reportedAt)}</span>
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 pt-2">
        <CredibilityMeter score={report.credibilityScore} />
        <SeverityBadge severity={report.severity} />
      </div>
    </Link>
  );
}