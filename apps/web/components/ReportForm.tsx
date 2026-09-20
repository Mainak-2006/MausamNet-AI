'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, ExternalLink, LocateFixed, Trash2 } from 'lucide-react';
import { useAuth } from '@/components/AuthContext';
import { useMutation } from '@/hooks/useApi';
import { API_URL } from '@/lib/api';
import type { Report } from '@/lib/types';
import {
  EVENT_CATEGORIES,
  SEVERITIES,
  categoryStyle,
} from '@/lib/constants';

interface MediaUpload {
  url: string;
  type: 'IMAGE' | 'VIDEO';
}

const INDIA_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan',
  'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
  'Uttarakhand', 'West Bengal',
];

export default function ReportForm() {
  const router = useRouter();
  const { session } = useAuth();
  const { submitting, error, run } = useMutation();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [severity, setSeverity] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [media, setMedia] = useState<MediaUpload[]>([]);
  const [uploading, setUploading] = useState(false);

  const locate = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toFixed(6));
        setLongitude(pos.coords.longitude.toFixed(6));
      },
      () => alert('Location access denied or unavailable'),
    );
  }, []);

  const onFile = async (file: File) => {
    if (!session) return;
    const form = new FormData();
    form.append('file', file);
    setUploading(true);
    try {
      const res = await fetch(`${API_URL}/api/media/upload`, {
        method: 'POST',
        headers: { authorization: `Bearer ${session.access_token}` },
        body: form,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? 'Upload failed');
      setMedia((m) => [...m, { url: json.url, type: json.type }]);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    try {
      const created = await run<Report>('/api/reports', {
        token: session.access_token,
        body: {
          title,
          description: description || undefined,
          category: category || undefined,
          severity: severity || undefined,
          city: city || undefined,
          state: state || undefined,
          latitude: latitude ? Number(latitude) : undefined,
          longitude: longitude ? Number(longitude) : undefined,
          media: media.length ? media : undefined,
        },
      });
      router.push(`/reports/${created.id}`);
    } catch {
      // error is surfaced via useMutation.error
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        maxLength={200}
        placeholder="Title (e.g. Heavy flooding near Hill Cart Road)"
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
      />

      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={4}
        maxLength={5000}
        placeholder="Describe what you observed — rain intensity, water levels, storm conditions…"
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">
            Event category <span className="text-slate-300">(optional — AI auto-detects)</span>
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
          >
            <option value="">Auto-detect with AI</option>
            {EVENT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {categoryStyle(c).emoji} {categoryStyle(c).label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">
            Severity <span className="text-slate-300">(optional)</span>
          </label>
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
          >
            <option value="">Automatic</option>
            {SEVERITIES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="City (e.g. Siliguri)"
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
        />
        <select
          value={state}
          onChange={(e) => setState(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
        >
          <option value="">State</option>
          {INDIA_STATES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Latitude</label>
            <input
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              placeholder="e.g. 26.7271"
              className="w-40 rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Longitude</label>
            <input
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              placeholder="e.g. 88.3953"
              className="w-40 rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="button"
            onClick={locate}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            <LocateFixed size={15} /> Use my GPS
          </button>
        </div>
      </div>

      <div>
        <label className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-500">
          <Camera size={14} /> Evidence (photos / videos)
        </label>
        <div className="flex flex-wrap gap-3">
          {media.map((m, i) => (
            <div key={i} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.url} alt="Uploaded evidence" className="h-24 w-24 rounded-xl object-cover" />
              <button
                type="button"
                onClick={() => setMedia((arr) => arr.filter((_, idx) => idx !== i))}
                className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
          <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 text-slate-400 hover:border-brand-400 hover:text-brand-600">
            {uploading ? 'Uploading…' : <ExternalLink size={18} />}
            <input
              type="file"
              accept="image/*,video/*"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onFile(file);
                e.target.value = '';
              }}
            />
          </label>
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <p className="text-xs text-slate-400">
        Your report is classified by AI, checked for duplicates, scored for
        credibility and queued for administrator verification.
      </p>

      <button
        type="submit"
        disabled={submitting || uploading}
        className="w-full rounded-xl bg-brand-600 py-3 font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {submitting ? 'Submitting & analysing…' : 'Submit weather report'}
      </button>
    </form>
  );
}