'use client';

import type { WeatherResponse } from '../../lib/api/types';

function providerLabel(provider: WeatherResponse['provider']): string {
  switch (provider) {
    case 'weatherapi':
      return 'WeatherAPI.com';
    case 'openweather':
      return 'OpenWeatherMap';
    case 'multi':
      return 'Multi-source';
    default:
      return provider;
  }
}

interface WeatherCurrentCardProps {
  data: WeatherResponse;
  compact?: boolean;
}

export default function WeatherCurrentCard({
  data,
  compact = false,
}: WeatherCurrentCardProps) {
  const { location, current } = data;

  return (
    <div
      className={`rounded-xl border border-gray-200 bg-white shadow-sm ${
        compact ? 'p-5' : 'p-6'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-500">
            {location.name}, {location.country}
          </p>
          <p className="mt-1 text-4xl font-bold text-gray-900">
            {Math.round(current.temperature)}
            <span className="text-2xl text-gray-400">°C</span>
          </p>
          <p className="mt-1 text-sm capitalize text-gray-600">
            {current.condition}
          </p>
        </div>
        <span className="shrink-0 rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
          {providerLabel(data.provider)}
        </span>
      </div>

      <dl
        className={`mt-4 grid grid-cols-2 gap-3 text-sm ${
          compact ? 'sm:grid-cols-2' : 'sm:grid-cols-3'
        }`}
      >
        <div>
          <dt className="text-xs text-gray-500">Feels like</dt>
          <dd className="font-medium text-gray-900">
            {Math.round(current.feelsLike)}°C
          </dd>
        </div>
        <div>
          <dt className="text-xs text-gray-500">Humidity</dt>
          <dd className="font-medium text-gray-900">{current.humidity}%</dd>
        </div>
        <div>
          <dt className="text-xs text-gray-500">Wind</dt>
          <dd className="font-medium text-gray-900">
            {Math.round(current.windSpeed)} km/h
          </dd>
        </div>
        <div>
          <dt className="text-xs text-gray-500">Precipitation</dt>
          <dd className="font-medium text-gray-900">
            {current.precipitation} mm
          </dd>
        </div>
        <div>
          <dt className="text-xs text-gray-500">Local time</dt>
          <dd className="font-medium text-gray-900">
            {location.localtime ?? '—'}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-gray-500">Updated</dt>
          <dd className="font-medium text-gray-900">
            {new Date(current.recordedAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </dd>
        </div>
      </dl>
    </div>
  );
}