'use client';

import type {
  WeatherForecastDay,
  WeatherResponse,
  WeatherSourceResult,
} from '../../lib/api/types';

function ForecastDayRow({ day }: { day: WeatherForecastDay }) {
  const date = new Date(`${day.date}T00:00:00`);
  const label = Number.isNaN(date.getTime())
    ? day.date
    : date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="w-28 text-sm font-medium text-gray-700">{label}</div>
      <div className="flex-1 text-sm capitalize text-gray-600">
        {day.condition}
      </div>
      <div className="w-8 shrink-0 text-right text-xs text-blue-600">
        {Math.round(day.precipitationProbability)}%
      </div>
      <div className="w-20 shrink-0 text-right text-sm text-gray-900">
        {Math.round(day.maxTemperature)}° / {Math.round(day.minTemperature)}°
      </div>
    </div>
  );
}

function SourcePanel({ source }: { source: WeatherSourceResult }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase text-gray-500">
          {source.provider}
        </p>
        <p className="text-sm font-bold text-gray-900">
          {Math.round(source.current.temperature)}°C
        </p>
      </div>
      <p className="mt-1 text-xs capitalize text-gray-600">
        {source.current.condition} · feels like{' '}
        {Math.round(source.current.feelsLike)}°C
      </p>
      <p className="text-xs text-gray-500">
        Humidity {source.current.humidity}% · Wind{' '}
        {Math.round(source.current.windSpeed)} km/h
      </p>
      {source.error && <p className="mt-1 text-xs text-red-600">{source.error}</p>}
    </div>
  );
}

interface WeatherForecastListProps {
  data: WeatherResponse;
}

export default function WeatherForecastList({ data }: WeatherForecastListProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900">
          5-day forecast
        </h3>
        <div className="mt-2 divide-y divide-gray-100">
          {data.forecast.length === 0 && (
            <p className="py-3 text-sm text-gray-500">
              No forecast available.
            </p>
          )}
          {data.forecast.map((day) => (
            <ForecastDayRow key={day.date} day={day} />
          ))}
        </div>
      </div>

      {data.provider === 'multi' && data.sources && data.sources.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900">
            Source comparison
          </h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {data.sources.map((source) => (
              <SourcePanel key={source.provider} source={source} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}