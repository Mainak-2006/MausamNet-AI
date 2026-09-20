'use client';

import { useState } from 'react';
import { BellRing, Power, PowerOff, Plus } from 'lucide-react';
import { useGet } from '@/hooks/useApi';
import { apiFetch } from '@/lib/api';
import type { AlertItem, EventCategory, Severity } from '@/lib/types';
import { EVENT_CATEGORIES, SEVERITIES, categoryStyle, timeAgo } from '@/lib/constants';
import { SeverityBadge } from '@/components/badges';

interface AlertsTabProps {
  token?: string | null;
}

export function AlertsTab({ token }: AlertsTabProps) {
  const { data: alerts, reload } = useGet<AlertItem[]>('/api/admin/alerts', token);

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState<EventCategory>('FLOOD');
  const [severity, setSeverity] = useState<Severity>('HIGH');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setNotice('Title and message are required');
      return;
    }
    setSubmitting(true);
    try {
      await apiFetch('/api/alerts', {
        method: 'POST',
        token,
        body: {
          title: title.trim(),
          message: message.trim(),
          category,
          severity,
          city: city.trim() || undefined,
          state: state.trim() || undefined,
        },
      });
      setTitle('');
      setMessage('');
      setCity('');
      setState('');
      setNotice('Alert created');
      reload();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Failed to create alert');
    } finally {
      setSubmitting(false);
    }
  };

  const toggle = async (a: AlertItem) => {
    try {
      await apiFetch(`/api/alerts/${a.id}/${a.isActive ? 'deactivate' : 'activate'}`, {
        method: 'PATCH',
        token,
      });
      setNotice(a.isActive ? 'Alert deactivated' : 'Alert activated');
      reload();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Action failed');
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <h2 className="mb-3 flex items-center gap-2 font-semibold text-slate-900">
          <Plus size={18} className="text-brand-600" /> Create alert
        </h2>
        <form onSubmit={create} className="card space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              placeholder="e.g. Heavy rainfall warning"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={2000}
              rows={3}
              placeholder="Details of the alert"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as EventCategory)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
              >
                {EVENT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Severity</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as Severity)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
              >
                {SEVERITIES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">City</label>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                maxLength={100}
                placeholder="e.g. Siliguri"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">State</label>
              <input
                value={state}
                onChange={(e) => setState(e.target.value)}
                maxLength={100}
                placeholder="e.g. West Bengal"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            <Plus size={16} /> {submitting ? 'Creating…' : 'Create alert'}
          </button>
        </form>
      </div>

      <div>
        <h2 className="mb-3 flex items-center gap-2 font-semibold text-slate-900">
          <BellRing size={18} className="text-amber-500" /> All alerts
        </h2>
        <div className="space-y-2">
          {(alerts ?? []).map((a) => (
            <div key={a.id} className="card flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="text-lg leading-none">{categoryStyle(a.category).emoji}</span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-slate-900">{a.title}</p>
                    <SeverityBadge severity={a.severity} />
                    {!a.isActive && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                        INACTIVE
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">{a.message}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {[a.city, a.state].filter(Boolean).join(', ') || 'Nationwide'} ·{' '}
                    {timeAgo(a.startAt)}
                    {a.source === 'CITIZEN' && !a.createdBy ? ' · auto-generated' : ''}
                  </p>
                </div>
              </div>
              <button
                onClick={() => toggle(a)}
                className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium ${
                  a.isActive
                    ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200 hover:bg-amber-100'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
              >
                {a.isActive ? <PowerOff size={14} /> : <Power size={14} />}
                {a.isActive ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          ))}
          {(alerts ?? []).length === 0 && (
            <div className="card text-sm text-slate-500">No alerts yet.</div>
          )}
        </div>
      </div>

      {notice && (
        <div className="rounded-xl bg-slate-900 px-4 py-2 text-sm text-white lg:col-span-2">
          {notice}
        </div>
      )}
    </div>
  );
}