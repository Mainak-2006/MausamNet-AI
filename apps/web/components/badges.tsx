import { statusStyle, severityStyle, categoryStyle } from '@/lib/constants';

export function StatusBadge({ status }: { status: string }) {
  const style = statusStyle(status);
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${style.className}`}
    >
      {style.label}
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: string }) {
  const style = severityStyle(severity);
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${style.className}`}
    >
      {severity}
    </span>
  );
}

export function CategoryIcon({ category, size = 14 }: { category: string; size?: number }) {
  const style = categoryStyle(category);
  return (
    <span title={style.label} style={{ fontSize: size }}>
      {style.emoji}
    </span>
  );
}

export function CredibilityMeter({ score }: { score: number }) {
  const color =
    score >= 81
      ? 'bg-emerald-500'
      : score >= 61
        ? 'bg-green-500'
        : score >= 31
          ? 'bg-amber-500'
          : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-200">
        <div className={`h-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-medium text-slate-600">{score}/100</span>
    </div>
  );
}