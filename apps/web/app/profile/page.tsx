'use client';

import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { useAuth } from '@/components/AuthContext';
import { useMutation } from '@/hooks/useApi';
import { apiFetch } from '@/lib/api';
import type { Profile } from '@/lib/types';

export default function ProfilePage() {
  const { user, session, refresh } = useAuth();
  const token = session?.access_token;
  const { submitting, error, run } = useMutation();

  const [name, setName] = useState(user?.name ?? '');
  const [username, setUsername] = useState(user?.username ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [city, setCity] = useState(user?.city ?? '');
  const [state, setState] = useState(user?.state ?? '');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setName(user?.name ?? '');
    setUsername(user?.username ?? '');
    setPhone(user?.phone ?? '');
    setCity(user?.city ?? '');
    setState(user?.state ?? '');
  }, [user]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      const updated = await run<Profile>('/api/users/me', {
        method: 'PATCH',
        token,
        body: {
          name: name || undefined,
          username: username || undefined,
          phone: phone || undefined,
          city: city || undefined,
          state: state || undefined,
        },
      });
      setSaved(true);
      await refresh();
    } catch {
      // error surfaced below
    }
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="mb-1 text-2xl font-bold text-slate-900">My profile</h1>
      <p className="mb-6 text-sm text-slate-500">
        Reporter credibility score:{' '}
        <span className="font-semibold text-emerald-600">{user?.credibilityScore ?? '—'}/100</span>
      </p>

      <form onSubmit={onSubmit} className="card space-y-4 p-6">
        <div className="flex flex-col gap-4 sm:flex-row">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
          />
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
          />
        </div>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone number"
          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
        />
        <div className="flex flex-col gap-4 sm:flex-row">
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="City"
            className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
          />
          <input
            value={state}
            onChange={(e) => setState(e.target.value)}
            placeholder="State"
            className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
          />
        </div>

        <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
          Email: {user?.email}
        </div>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {saved && (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            Profile updated.
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-2.5 font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          <Save size={16} /> {submitting ? 'Saving…' : 'Save profile'}
        </button>
      </form>
    </div>
  );
}