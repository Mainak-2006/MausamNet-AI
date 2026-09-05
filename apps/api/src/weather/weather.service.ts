import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  WeatherCurrent,
  WeatherForecastDay,
  WeatherLocation,
  WeatherProvider,
  WeatherResponse,
  WeatherSourceResult,
} from '@mausamnet/shared';

export interface WeatherQueryParams {
  city?: string;
  lat?: number;
  lng?: number;
}

type ActiveWeatherProvider = Exclude<WeatherProvider, 'multi'>;

type SingleSourceWeatherResponse = WeatherResponse & {
  provider: ActiveWeatherProvider;
};

interface OpenWeatherEntry {
  dt_txt?: string;
  main?: {
    temp?: number;
    feels_like?: number;
    humidity?: number;
  };
  wind?: { speed?: number };
  rain?: Record<string, number>;
  pop?: number;
  weather?: Array<{ id?: number; description?: string }>;
}

interface RawOpenWeatherResponse extends OpenWeatherEntry {
  name?: string;
  sys?: { country?: string };
  coord?: { lat?: number; lon?: number };
  timezone?: number;
  list?: OpenWeatherEntry[];
}

interface RawWeatherApiCondition {
  text?: string;
  code?: number;
}

interface RawWeatherApiResponse {
  location?: {
    name?: string;
    country?: string;
    lat?: number;
    lon?: number;
    tz_id?: string;
    localtime?: string;
  };
  current?: {
    temp_c?: number;
    feelslike_c?: number;
    humidity?: number;
    wind_kph?: number;
    precip_mm?: number;
    condition?: RawWeatherApiCondition;
    last_updated?: string;
  };
  forecast?: {
    forecastday?: Array<{
      date?: string;
      day?: {
        maxtemp_c?: number;
        mintemp_c?: number;
        daily_chance_of_rain?: number;
        condition?: RawWeatherApiCondition;
      };
    }>;
  };
}

@Injectable()
export class WeatherService {
  private readonly providers: ActiveWeatherProvider[];
  private readonly openWeatherBase = 'https://api.openweathermap.org/data/2.5';
  private readonly weatherApiBase = 'https://api.weatherapi.com/v1';

  private static readonly VALID_PROVIDERS: ActiveWeatherProvider[] = [
    'weatherapi',
    'openweather',
  ];

  constructor(private readonly configService: ConfigService) {
    const rawProviders = this.configService.get<string>(
      'WEATHER_PROVIDERS',
      this.configService.get<string>('WEATHER_PROVIDER', ''),
    );

    const parsed = (rawProviders ?? '')
      .split(',')
      .map((entry) => entry.trim().toLowerCase())
      .filter((entry): entry is ActiveWeatherProvider =>
        WeatherService.VALID_PROVIDERS.includes(entry as ActiveWeatherProvider),
      );

    this.providers =
      parsed.length > 0
        ? Array.from(new Set(parsed))
        : ['weatherapi'];
  }

  private getKey(envKey: string): string {
    return this.configService.get<string>(envKey, '');
  }

  private assertConfigured(envKey: string, providerName: string): void {
    const key = this.getKey(envKey);

    if (!key || key.startsWith('your_')) {
      throw new ServiceUnavailableException(
        `${providerName} API key is not configured`,
      );
    }
  }

  private async fetchJson<T>(url: string): Promise<T> {
    const response = await fetch(url);

    if (!response.ok) {
      throw new ServiceUnavailableException(
        `Weather request failed with status ${response.status}`,
      );
    }

    return response.json() as Promise<T>;
  }

  private buildCityQuery(params: WeatherQueryParams): string {
    if (params.city) {
      return `q=${encodeURIComponent(params.city)}`;
    }

    if (params.lat !== undefined && params.lng !== undefined) {
      return `q=${params.lat},${params.lng}`;
    }

    throw new BadRequestException(
      'Provide either a city or both lat and lng',
    );
  }

  private buildCoordinatesQuery(params: WeatherQueryParams): string {
    if (params.city) {
      return `q=${encodeURIComponent(params.city)}`;
    }

    if (params.lat !== undefined && params.lng !== undefined) {
      return `lat=${params.lat}&lon=${params.lng}`;
    }

    throw new BadRequestException(
      'Provide either a city or both lat and lng',
    );
  }

  async currentWeather(params: WeatherQueryParams): Promise<WeatherResponse> {
    if (this.providers.length === 1) {
      return this.singleCurrent(this.providers[0], params);
    }

    return this.multiSource('current', params);
  }

  async forecast(params: WeatherQueryParams): Promise<WeatherResponse> {
    if (this.providers.length === 1) {
      return this.singleForecast(this.providers[0], params);
    }

    return this.multiSource('forecast', params);
  }

  // ---------------------------------------------------------------
  // Multi-source mode
  // ---------------------------------------------------------------

  private async multiSource(
    mode: 'current' | 'forecast',
    params: WeatherQueryParams,
  ): Promise<WeatherResponse> {
    const coords = await this.resolveCoordinates(params);
    const effectiveParams = coords ? { lat: coords.lat, lng: coords.lng } : params;

    const settled = await Promise.allSettled(
      this.providers.map((provider) =>
        mode === 'current'
          ? this.singleCurrent(provider, effectiveParams)
          : this.singleForecast(provider, effectiveParams),
      ),
    );

    const sources = this.providers.map((provider, index): WeatherSourceResult => {
      const result = settled[index];

      if (result.status === 'fulfilled') {
        return result.value;
      }

      return {
        provider,
        location: this.emptyLocation(),
        current: this.emptyCurrent(),
        forecast: [],
        error: this.errorMessage(result.reason),
      };
    });

    const successful = sources.filter((source) => !source.error);

    if (successful.length === 0) {
      throw new ServiceUnavailableException(
        'All weather providers failed to respond',
      );
    }

    const primary =
      successful.find((source) => source.provider === this.providers[0]) ??
      successful[0];

    return {
      provider: 'multi',
      location: primary.location,
      current: primary.current,
      forecast: primary.forecast,
      sources,
    };
  }

  private async resolveCoordinates(
    params: WeatherQueryParams,
  ): Promise<{ lat: number; lng: number } | null> {
    if (params.lat !== undefined && params.lng !== undefined) {
      return null;
    }

    if (!params.city) {
      throw new BadRequestException(
        'Provide either a city or both lat and lng',
      );
    }

    const resolved = await this.singleCurrent(this.providers[0], {
      city: params.city,
    });

    return {
      lat: resolved.location.latitude,
      lng: resolved.location.longitude,
    };
  }

  private emptyLocation(): WeatherLocation {
    return {
      name: 'Unknown',
      country: 'IN',
      latitude: 0,
      longitude: 0,
    };
  }

  private emptyCurrent(): WeatherCurrent {
    return {
      temperature: 0,
      feelsLike: 0,
      humidity: 0,
      windSpeed: 0,
      precipitation: 0,
      weatherCode: 0,
      condition: 'Unknown',
      recordedAt: new Date().toISOString(),
    };
  }

  private errorMessage(reason: unknown): string {
    return reason instanceof Error ? reason.message : String(reason);
  }

  // ---------------------------------------------------------------
  // Single-provider dispatch
  // ---------------------------------------------------------------

  private async singleCurrent(
    provider: ActiveWeatherProvider,
    params: WeatherQueryParams,
  ): Promise<SingleSourceWeatherResponse> {
    if (provider === 'openweather') {
      return this.openWeatherCurrent(params);
    }

    return this.weatherApiCurrent(params);
  }

  private async singleForecast(
    provider: ActiveWeatherProvider,
    params: WeatherQueryParams,
  ): Promise<SingleSourceWeatherResponse> {
    if (provider === 'openweather') {
      return this.openWeatherForecast(params);
    }

    return this.weatherApiForecast(params);
  }

  // ---------------------------------------------------------------
  // WeatherAPI.com
  // ---------------------------------------------------------------

  private async weatherApiCurrent(
    params: WeatherQueryParams,
  ): Promise<SingleSourceWeatherResponse> {
    this.assertConfigured('WEATHERAPI_API_KEY', 'WeatherAPI');

    const data = await this.fetchJson<RawWeatherApiResponse>(
      `${this.weatherApiBase}/current.json?key=${this.getKey(
        'WEATHERAPI_API_KEY',
      )}&${this.buildCityQuery(params)}`,
    );

    const result = this.mapWeatherApi(data);
    result.forecast = [];
    return result;
  }

  private async weatherApiForecast(
    params: WeatherQueryParams,
  ): Promise<SingleSourceWeatherResponse> {
    this.assertConfigured('WEATHERAPI_API_KEY', 'WeatherAPI');

    const data = await this.fetchJson<RawWeatherApiResponse>(
      `${this.weatherApiBase}/forecast.json?key=${this.getKey(
        'WEATHERAPI_API_KEY',
      )}&${this.buildCityQuery(params)}&days=5`,
    );

    return this.mapWeatherApi(data);
  }

  private mapWeatherApi(data: RawWeatherApiResponse): SingleSourceWeatherResponse {
    const location = data.location ?? {};
    const current = data.current ?? {};

    return {
      provider: 'weatherapi',
      location: {
        name: location.name ?? 'Unknown',
        country: location.country ?? 'IN',
        latitude: location.lat ?? 0,
        longitude: location.lon ?? 0,
        timezone: location.tz_id,
        localtime: location.localtime,
      },
      current: {
        temperature: current.temp_c ?? 0,
        feelsLike: current.feelslike_c ?? 0,
        humidity: current.humidity ?? 0,
        windSpeed: current.wind_kph ?? 0,
        precipitation: current.precip_mm ?? 0,
        weatherCode: current.condition?.code ?? 0,
        condition: current.condition?.text ?? 'Unknown',
        recordedAt: current.last_updated ?? new Date().toISOString(),
      },
      forecast: (data.forecast?.forecastday ?? []).map(
        (day): WeatherForecastDay => ({
          date: day.date ?? '',
          maxTemperature: day.day?.maxtemp_c ?? 0,
          minTemperature: day.day?.mintemp_c ?? 0,
          precipitationProbability: day.day?.daily_chance_of_rain ?? 0,
          weatherCode: day.day?.condition?.code ?? 0,
          condition: day.day?.condition?.text ?? 'Unknown',
        }),
      ),
    };
  }

  // ---------------------------------------------------------------
  // OpenWeatherMap
  // ---------------------------------------------------------------

  private async openWeatherCurrent(
    params: WeatherQueryParams,
  ): Promise<SingleSourceWeatherResponse> {
    this.assertConfigured('OPENWEATHER_API_KEY', 'OpenWeather');

    const data = await this.fetchJson<RawOpenWeatherResponse>(
      `${this.openWeatherBase}/weather?${this.buildCoordinatesQuery(
        params,
      )}&units=metric&appid=${this.getKey('OPENWEATHER_API_KEY')}`,
    );

    return {
      provider: 'openweather',
      location: this.mapOpenWeatherLocation(data),
      current: this.mapOpenWeatherCurrent(data),
      forecast: [],
    };
  }

  private async openWeatherForecast(
    params: WeatherQueryParams,
  ): Promise<SingleSourceWeatherResponse> {
    this.assertConfigured('OPENWEATHER_API_KEY', 'OpenWeather');

    const data = await this.fetchJson<RawOpenWeatherResponse>(
      `${this.openWeatherBase}/forecast?${this.buildCoordinatesQuery(
        params,
      )}&units=metric&appid=${this.getKey('OPENWEATHER_API_KEY')}`,
    );

    return {
      provider: 'openweather',
      location: this.mapOpenWeatherLocation(data),
      current: this.mapOpenWeatherCurrent(data.list?.[0]),
      forecast: this.mapOpenWeatherForecast(data.list ?? []),
    };
  }

  private mapOpenWeatherLocation(data: RawOpenWeatherResponse): WeatherLocation {
    return {
      name: data.name ?? 'Unknown',
      country: data.sys?.country ?? 'IN',
      latitude: data.coord?.lat ?? 0,
      longitude: data.coord?.lon ?? 0,
      timezone: data.timezone != null ? String(data.timezone) : undefined,
    };
  }

  private mapOpenWeatherCurrent(data: RawOpenWeatherResponse): WeatherCurrent {
    const main = data.main ?? {};
    const wind = data.wind ?? {};
    const rain = data.rain ?? {};
    const weather = data.weather?.[0];

    return {
      temperature: this.round(main.temp),
      feelsLike: this.round(main.feels_like),
      humidity: main.humidity ?? 0,
      windSpeed: this.round((wind.speed ?? 0) * 3.6),
      precipitation: this.round(rain['1h'] ?? rain['3h'] ?? 0),
      weatherCode: weather?.id ?? 0,
      condition: weather?.description ?? 'Unknown',
      recordedAt: new Date().toISOString(),
    };
  }

  private mapOpenWeatherForecast(
    list: OpenWeatherEntry[],
  ): WeatherForecastDay[] {
    const days = new Map<string, WeatherForecastDay>();

    for (const item of list) {
      const date = item.dt_txt?.slice(0, 10) ?? '';
      if (!date) {
        continue;
      }

      const temperature = item.main?.temp ?? 0;
      const precipitationProbability = this.round((item.pop ?? 0) * 100);
      const existing = days.get(date);

      if (!existing) {
        days.set(date, {
          date,
          maxTemperature: temperature,
          minTemperature: temperature,
          precipitationProbability,
          weatherCode: item.weather?.[0]?.id ?? 0,
          condition: item.weather?.[0]?.description ?? 'Unknown',
        });
        continue;
      }

      existing.maxTemperature = Math.max(existing.maxTemperature, temperature);
      existing.minTemperature = Math.min(existing.minTemperature, temperature);
      existing.precipitationProbability = Math.max(
        existing.precipitationProbability,
        precipitationProbability,
      );
    }

    return Array.from(days.values()).sort((a, b) =>
      a.date.localeCompare(b.date),
    );
  }

  private round(value: number | undefined): number {
    return Math.round(value ?? 0);
  }
}