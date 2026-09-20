import { BadGatewayException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SourceType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface NormalizedWeather {
  city: string;
  state?: string;
  latitude?: number;
  longitude?: number;
  temperature?: number;
  feelsLike?: number;
  humidity?: number;
  pressure?: number;
  windSpeed?: number;
  windDirection?: number;
  condition?: string;
  source: SourceType;
  observedAt: Date;
}

@Injectable()
export class WeatherService {
  private readonly logger = new Logger(WeatherService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async getCurrent(query: {
    city?: string;
    lat?: number;
    lon?: number;
  }): Promise<NormalizedWeather> {
    const providers = (this.config.get<string>('WEATHER_PROVIDERS') ?? 'openweather,weatherapi')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    let lastError: unknown;
    for (const provider of providers) {
      try {
        const data =
          provider === 'openweather'
            ? await this.fromOpenWeather(query)
            : provider === 'weatherapi'
              ? await this.fromWeatherApi(query)
              : null;
        if (data) return data;
      } catch (err) {
        lastError = err;
        this.logger.warn(`${provider} failed: ${String(err)}`);
      }
    }
    throw new BadGatewayException(
      `All weather providers unavailable${lastError ? ` (${String(lastError)})` : ''}`,
    );
  }

  async syncSnapshot(query: {
    city?: string;
    lat?: number;
    lon?: number;
  }): Promise<NormalizedWeather> {
    const data = await this.getCurrent(query);
    if (data.city) {
      await this.prisma.weatherSnapshot.create({
        data: {
          city: data.city,
          state: data.state,
          latitude: data.latitude,
          longitude: data.longitude,
          temperature: data.temperature,
          feelsLike: data.feelsLike,
          humidity: data.humidity,
          pressure: data.pressure,
          windSpeed: data.windSpeed,
          windDirection: data.windDirection,
          condition: data.condition,
          source: data.source,
          observedAt: data.observedAt,
        },
      });
      this.logger.log(`Weather snapshot stored for ${data.city}`);
    }
    return data;
  }

  async providersStatus() {
    return (this.config.get<string>('WEATHER_PROVIDERS') ?? 'openweather,weatherapi')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => ({
        name: s,
        configured:
          !!this.config.get<string>(
            s === 'openweather' ? 'OPENWEATHER_API_KEY' : 'WEATHERAPI_API_KEY',
          ),
      }));
  }

  private async fromOpenWeather(query: {
    city?: string;
    lat?: number;
    lon?: number;
  }): Promise<NormalizedWeather | null> {
    const key = this.config.get<string>('OPENWEATHER_API_KEY');
    if (!key) return null;
    let lat = query.lat;
    let lon = query.lon;
    if (query.city && (lat == null || lon == null)) {
      const geoRes = await this.fetchJson(
        `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query.city)}&limit=1&appid=${key}`,
      );
      const place = Array.isArray(geoRes) ? geoRes[0] : null;
      if (place) {
        lat = place.lat;
        lon = place.lon;
        if (!query.city) return null;
      }
    }
    if (lat == null || lon == null) return null;

    const data = await this.fetchJson(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${key}`,
    );
    return {
      city: data.name ?? query.city ?? 'Unknown',
      latitude: lat,
      longitude: lon,
      temperature: data.main?.temp,
      feelsLike: data.main?.feels_like,
      humidity: data.main?.humidity,
      pressure: data.main?.pressure,
      windSpeed: data.wind?.speed,
      windDirection: data.wind?.deg,
      condition: data.weather?.[0]?.description,
      source: SourceType.OPENWEATHER,
      observedAt: new Date(),
    };
  }

  private async fromWeatherApi(query: {
    city?: string;
    lat?: number;
    lon?: number;
  }): Promise<NormalizedWeather | null> {
    const key = this.config.get<string>('WEATHERAPI_API_KEY');
    if (!key) return null;
    const q =
      query.lat != null && query.lon != null
        ? `${query.lat},${query.lon}`
        : query.city;
    if (!q) return null;

    const data = await this.fetchJson(
      `https://api.weatherapi.com/v1/current.json?key=${key}&q=${encodeURIComponent(q)}`,
    );
    const loc = data.location ?? {};
    const cur = data.current ?? {};
    return {
      city: loc.name ?? query.city,
      state: loc.region,
      latitude: loc.lat,
      longitude: loc.lon,
      temperature: cur.temp_c,
      feelsLike: cur.feelslike_c,
      humidity: cur.humidity,
      pressure: cur.pressure_mb,
      windSpeed: cur.wind_kph,
      windDirection: cur.wind_degree,
      condition: cur.condition?.text,
      source: SourceType.WEATHERAPI,
      observedAt: new Date(),
    };
  }

  private async fetchJson(url: string): Promise<any> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    try {
      const res = await fetch(url, { signal: controller.signal });
      const json = await res.json();
      if (!res.ok) throw new Error(`${res.status}: ${JSON.stringify(json)}`);
      return json;
    } finally {
      clearTimeout(timeout);
    }
  }
}