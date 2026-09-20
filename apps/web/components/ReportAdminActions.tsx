'use client';

import { useState } from 'react';
import { CheckCircle2, RotateCcw, ShieldAlert, Shuffle } from 'lucide-react';
import { useAuth } from '@/components/AuthContext';
import { apiFetch } from '@/lib/api';
import type { Report, ReportStatus } from '@/lib/types';

interface Props {
  report: Report;
  onChanged?: () => void;
  compact?: boolean;
}

type Action = Extract<ReportStatus, 'VERIFIED' | 'SUSPICIOUS' | 'REJECTED' | 'PENDING'>;

const ACTION_ROUTE: Record<Action, string> = {
  VERIFIED: 'verify',
  SUSPICIOUS: 'suspect',
  REJECTED: 'reject',
  PENDING: 'pending',
};

export default function ReportAdminActions({ report, onChanged, compact }: Props) {
  const { user, session } = useAuth();
  const token = session?.access_token;
  const [busy, setBusy] = useState<Action | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) return null;

  const act = async (action: Action) => {
    const notes = window.prompt('Verification note (optional):') ?? undefined;
    try {
      setBusy(action);
      await apiFetch(`/api/admin/reports/${report.id}/${ACTION_ROUTE[action]}`, {
        method: 'POST',
        token,
        body: notes ? { notes } : {},
      });
      setNotice(`Marked as ${action}`);
      onChanged?.();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setBusy(null);
    }
  };

  const buttons: Array<{
    action: Action;
    label: string;
    className: string;
    icon: React.ReactNode;
  }> = [
    {
      action: 'VERIFIED',
      label: 'Verify',
      className: 'bg-emerald-600 text-white hover:bg-emerald-700',
      icon: <CheckCircle2 size={14} />,
    },
    {
      action: 'SUSPICIOUS',
      label: 'Flag suspicious',
      className: 'bg-amber-500 text-white hover:bg-amber-600',
      icon: <ShieldAlert size={14} />,
    },
    {
      action: 'REJECTED',
      label: 'Reject',
      className: 'bg-red-600 text-white hover:bg-red-700',
      icon: <Shuffle size={14} />,
    },
    {
      action: 'PENDING',
      label: 'Mark pending',
      className: 'bg-slate-200 text-slate-700 hover:bg-slate-300',
      icon: <RotateCcw size={14} />,
    },
  ];

  return (
    <div className={compact ? 'rounded-xl border border-slate-200 bg-white p-2' : 'card p-4'}>
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        Admin review
      </p>
      <div className="flex flex-wrap gap-2">
        {buttons.map((b) => (
          <button
            key={b.action}
            disabled={busy !== null}
            onClick={() => act(b.action)}
            className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium disabled:opacity-40 ${
              report.status === b.action
                ? 'cursor-not-allowed ring-1 ring-inset ring-current opacity-60'
                : b.className
            }`}
          >
            {b.icon} {b.label}
          </button>
        ))}
      </div>
      {notice && <p className="mt-2 text-xs text-slate-500">{notice}</p>}
    </div>
  );
}