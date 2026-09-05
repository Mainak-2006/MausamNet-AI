'use client';

import { useEffect, useState } from 'react';
import type { WeatherResponse } from '../lib/api/types';
import { fetchWeather } from '../lib/weather';

export interface WeatherQueryInput {
  city?: string;
  lat?: number;
  lng?: number;
}

interface WeatherResult {
  query: WeatherQueryInput | null;
  data: WeatherResponse | null;
  error: string | null;
}

export function useWeather(initialQuery?: WeatherQueryInput) {
  const [query, setQuery] = useState<WeatherQueryInput | null>(
    initialQuery ?? null,
  );
  const [result, setResult] = useState<WeatherResult>({
    query: null,
    data: null,
    error: null,
  });

  const loading = query !== null && result.query !== query;

  useEffect(() => {
    if (!query) {
      return;
    }

    let active = true;

    fetchWeather(query)
      .then((data) => {
        if (active) setResult({ query, data, error: null });
      })
      .catch((err) => {
        if (active) {
          setResult({
            query,
            data: null,
            error:
              (err as { message?: string }).message ?? 'Failed to load weather',
          });
        }
      });

    return () => {
      active = false;
    };
  }, [query]);

  return { data: result.data, loading, error: result.error, query, setQuery };
}