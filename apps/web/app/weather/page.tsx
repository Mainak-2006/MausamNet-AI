import { Database } from 'lucide-react';
import WeatherWidget from '@/components/WeatherWidget';

export const metadata = { title: 'Weather | MausamNet-AI' };

export default function WeatherPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white">
          <Database size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Live weather</h1>
          <p className="text-sm text-slate-500">
            Real-time conditions from OpenWeather &amp; WeatherAPI, used to cross-check citizen reports
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <WeatherWidget initialCity="Kolkata" />
        <WeatherWidget initialCity="Delhi" />
      </div>
    </div>
  );
}