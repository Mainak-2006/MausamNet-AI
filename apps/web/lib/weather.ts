import { apiGet } from './api';
import type { WeatherResponse } from './api/types';

export interface WeatherQuery {
  city?: string;
  lat?: number;
  lng?: number;
}

export async function fetchWeather(query: WeatherQuery): Promise<WeatherResponse> {
  return apiGet<WeatherResponse>('/api/weather/forecast', {
    city: query.city,
    lat: query.lat,
    lng: query.lng,
  });
}

export async function fetchCurrentWeather(
  query: WeatherQuery,
): Promise<WeatherResponse> {
  return apiGet<WeatherResponse>('/api/weather/current', {
    city: query.city,
    lat: query.lat,
    lng: query.lng,
  });
}