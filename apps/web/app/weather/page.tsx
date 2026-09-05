'use client';

import { useEffect, useState } from 'react';
import AuthGuard from '../../components/auth/AuthGuard';
import WeatherCurrentCard from '../../components/weather/WeatherCurrentCard';
import WeatherForecastList from '../../components/weather/WeatherForecastList';
import WeatherSearch from '../../components/weather/WeatherSearch';
import { useWeather } from '../../hooks/use-weather';

export default function WeatherPage() {
  const DEFAULT_CITY = 'Delhi';
  const { data, loading, error, setQuery: load } = useWeather();
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    load({ city: DEFAULT_CITY });
  }, [load]);

  const useMyLocation = () => {
    setLocationError(null);
    if (!('geolocation' in navigator)) {
      setLocationError('Geolocation is not supported by this browser.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        load({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setLocating(false);
        setLocationError('Could not access your location.');
      },
    );
  };

  return (
    <AuthGuard>
      <div className="space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Weather</h1>
            <p className="text-sm text-gray-500">
              Live current conditions and 5-day forecast from weather providers.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <WeatherSearch onSearch={(city) => load({ city })} />
          <button
            onClick={useMyLocation}
            disabled={locating}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
          >
            {locating ? 'Locating…' : 'Use my location'}
          </button>
        </div>

        {locationError && (
          <div className="rounded-md bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
            {locationError}
          </div>
        )}

        {error && !loading && (
          <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex h-64 items-center justify-center rounded-xl border border-gray-200 bg-white">
            <p className="text-sm text-gray-500">Loading weather…</p>
          </div>
        )}

        {!loading && data && (
          <div className="grid gap-6 lg:grid-cols-2">
            <WeatherCurrentCard data={data} />
            <WeatherForecastList data={data} />
          </div>
        )}
      </div>
    </AuthGuard>
  );
}