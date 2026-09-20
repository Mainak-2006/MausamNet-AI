'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Droplets, Gauge, LocateFixed, Search, Thermometer, Wind } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface WeatherData {
  city: string;
  state?: string;
  temperature?: number;
  feelsLike?: number;
  humidity?: number;
  pressure?: number;
  windSpeed?: number;
  windDirection?: number;
  condition?: string;
  source: string;
  observedAt: string;
}

function locationToCity() {
  return new Promise<{ city?: string; lat: number; lon: number }>((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('Geolocation unavailable'));
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      reject,
    );
  });
}

export default function WeatherWidget({ initialCity = 'Siliguri' }) {
  const [city, setCity] = useState(initialCity);
  const [query, setQuery] = useState(initialCity);
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (q: string, coords?: { lat: number; lon: number }) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (coords) {
        params.set('lat', String(coords.lat));
        params.set('lon', String(coords.lon));
      } else {
        params.set('city', q);
      }
      const res = await apiFetch<WeatherData>(`/api/weather/current?${params.toString()}`);
      setData(res);
      setCity(res.city);
      setQuery(res.city);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Weather unavailable');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(initialCity);
  }, [initialCity, load]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim()) load(query.trim());
  };

  const onLocate = async () => {
    try {
      const coords = await locationToCity();
      await load('', coords);
    } catch {
      setError('Could not get your location');
    }
  };

  const stats = [
    { icon: <Thermometer size={16} />, label: 'Temperature', value: data?.temperature != null ? `${Math.round(data.temperature)}°C` : '—' },
    { icon: <Droplets size={16} />, label: 'Humidity', value: data?.humidity != null ? `${data.humidity}%` : '—' },
    { icon: <Wind size={16} />, label: 'Wind', value: data?.windSpeed != null ? `${Math.round(data.windSpeed)} km/h` : '—' },
    { icon: <Gauge size={16} />, label: 'Pressure', value: data?.pressure != null ? `${Math.round(data.pressure)} hPa` : '—' },
  ];

  return (
    <div className="card">
      <h2 className="mb-3 font-semibold text-slate-900">Current weather — {city}</h2>
      <form onSubmit={onSubmit} className="mb-4 flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="City name"
          className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-brand-500 focus:outline-none"
        />
        <button type="submit" className="rounded-xl bg-brand-600 px-3 text-white hover:bg-brand-700">
          <Search size={16} />
        </button>
        <button
          type="button"
          onClick={onLocate}
          className="rounded-xl border border-slate-200 px-3 text-slate-600 hover:bg-slate-50"
          title="Use my location"
        >
          <LocateFixed size={16} />
        </button>
      </form>

      {loading && <p className="text-sm text-slate-400">Fetching weather…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {data && !loading && (
        <>
          <div className="mb-4 rounded-xl bg-slate-50 p-4">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-4xl font-bold text-slate-900">
                  {data.temperature != null ? `${Math.round(data.temperature)}°C` : '—'}
                </p>
                {data.feelsLike != null && (
                  <p className="text-sm text-slate-500">Feels like {Math.round(data.feelsLike)}°C</p>
                )}
              </div>
              <p className="text-sm font-medium capitalize text-slate-700">{data.condition ?? '—'}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="rounded-xl border border-slate-100 p-3">
                <div className="mb-1 flex items-center gap-1.5 text-xs text-slate-400">{s.icon} {s.label}</div>
                <div className="font-semibold text-slate-800">{s.value}</div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-400">
            Source: {data.source.toLowerCase()} · verified against official weather APIs
          </p>
        </>
      )}
    </div>
  );
}