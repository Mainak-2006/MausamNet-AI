import {
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { WeatherService } from './weather.service';

describe('WeatherService', () => {
  let service: WeatherService;

  const weatherApiPayload = {
    location: { name: 'Mumbai', country: 'India', lat: 19.07, lon: 72.88, tz_id: 'Asia/Kolkata', localtime: '2026-09-05 12:00' },
    current: {
      temp_c: 28,
      feelslike_c: 30,
      humidity: 75,
      wind_kph: 12.6,
      precip_mm: 0.5,
      condition: { text: 'Partly cloudy', code: 1003 },
      last_updated: '2026-09-05 12:00',
    },
    forecast: {
      forecastday: [
        {
          date: '2026-09-06',
          day: {
            maxtemp_c: 30,
            mintemp_c: 22,
            daily_chance_of_rain: 40,
            condition: { text: 'Patchy rain possible', code: 1063 },
          },
        },
      ],
    },
  };

  const openWeatherPayload = {
    name: 'Mumbai',
    sys: { country: 'IN' },
    coord: { lat: 19.07, lon: 72.88 },
    main: { temp: 29.99, feels_like: 36, humidity: 74 },
    wind: { speed: 3.5 },
    weather: [{ id: 800, description: 'clear sky' }],
    list: [
      {
        dt_txt: '2026-09-06 12:00:00',
        main: { temp: 30 },
        rain: { '3h': 1 },
        pop: 0.5,
        weather: [{ id: 501, description: 'moderate rain' }],
      },
    ],
  };

  const setup = (overrides: Record<string, string> = {}) => {
    const defaults: Record<string, string> = {
      WEATHER_PROVIDER: '',
      WEATHER_PROVIDERS: '',
      WEATHERAPI_API_KEY: 'wx-key',
      OPENWEATHER_API_KEY: 'owm-key',
    };
    const env = { ...defaults, ...overrides };
    const config = {
      get: jest.fn((key: string, fallback?: string) => env[key] ?? fallback),
    };
    service = new WeatherService(config as never);
  };

  const mockFetchByUrl = (
    resolver: (url: string) => Promise<unknown>,
  ) => {
    global.fetch = jest.fn((url: string) =>
      resolver(String(url)).then((json) => ({
        ok: true,
        json: () => Promise.resolve(json),
      })),
    ) as unknown as typeof fetch;
  };

  const mockFetchDataBased = () =>
    mockFetchByUrl((url) =>
      url.includes('api.weatherapi.com')
        ? Promise.resolve(weatherApiPayload)
        : Promise.resolve(openWeatherPayload),
    );

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should use WeatherAPI when a single provider is configured (backward compat)', async () => {
    setup({ WEATHER_PROVIDER: 'weatherapi' });
    mockFetchDataBased();

    const result = await service.currentWeather({ city: 'Mumbai' });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(result.provider).toBe('weatherapi');
    expect(result.sources).toBeUndefined();
  });

  it('should default to weatherapi when no provider is configured', async () => {
    setup();
    mockFetchDataBased();

    const result = await service.currentWeather({ city: 'Mumbai' });

    expect(result.provider).toBe('weatherapi');
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('should query both providers in parallel and merge them into one response', async () => {
    setup({ WEATHER_PROVIDERS: 'weatherapi,openweather' });
    mockFetchDataBased();

    const result = await service.currentWeather({ lat: 19.07, lng: 72.88 });

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(result.provider).toBe('multi');
    expect(result.current.temperature).toBe(28); // canonical from weatherapi (primary)
    expect(result.sources).toHaveLength(2);
    expect(result.sources?.[0].provider).toBe('weatherapi');
    expect(result.sources?.[1].provider).toBe('openweather');
    expect(result.sources?.every((source) => source.error === undefined)).toBe(
      true,
    );
  });

  it('should resolve the city once, then query both sources at that coordinate', async () => {
    setup({ WEATHER_PROVIDERS: 'weatherapi,openweather' });
    mockFetchDataBased();

    await service.currentWeather({ city: 'Mumbai' });

    expect(global.fetch).toHaveBeenCalledTimes(3); // 1 geocode + 2 sources
    const urls = (global.fetch as jest.Mock).mock.calls.map(([url]) => url);
    expect(urls[1]).toContain('q=19.07,72.88');
    expect(urls[2]).toContain('lat=19.07&lon=72.88');
  });

  it('should keep serving data when one provider fails', async () => {
    setup({ WEATHER_PROVIDERS: 'weatherapi,openweather' });
    mockFetchByUrl((url) =>
      url.includes('api.weatherapi.com')
        ? Promise.resolve(weatherApiPayload)
        : Promise.reject(new Error('boom')),
    );

    const result = await service.currentWeather({ lat: 19.07, lng: 72.88 });

    expect(result.provider).toBe('multi');
    expect(result.current.temperature).toBe(28);
    expect(result.sources?.[1]).toMatchObject({
      provider: 'openweather',
      error: 'boom',
    });
  });

  it('should throw ServiceUnavailableException when every provider fails', async () => {
    setup({ WEATHER_PROVIDERS: 'weatherapi,openweather' });
    mockFetchByUrl(() => Promise.reject(new Error('down')));

    await expect(service.currentWeather({ lat: 19.07, lng: 72.88 })).rejects.toThrow(
      ServiceUnavailableException,
    );
  });

  it('should ignore invalid providers and deduplicate the list', async () => {
    setup({ WEATHER_PROVIDERS: 'weatherapi,openweather,foo,weatherapi' });
    mockFetchDataBased();

    await service.currentWeather({ lat: 19.07, lng: 72.88 });

    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('should forward a multi-source forecast with per-source data', async () => {
    setup({ WEATHER_PROVIDERS: 'weatherapi,openweather' });
    mockFetchDataBased();

    const result = await service.forecast({ lat: 19.07, lng: 72.88 });

    expect(result.provider).toBe('multi');
    expect(result.forecast).toEqual([
      {
        date: '2026-09-06',
        maxTemperature: 30,
        minTemperature: 22,
        precipitationProbability: 40,
        weatherCode: 1063,
        condition: 'Patchy rain possible',
      },
    ]);
    expect(result.sources?.[0].forecast).toHaveLength(1);
    expect(result.sources?.[1].forecast).toHaveLength(1); // grouped into one day
  });

  it('should throw BadRequestException when neither city nor coordinates given', async () => {
    setup({ WEATHER_PROVIDERS: 'weatherapi,openweather' });
    global.fetch = jest.fn() as unknown as typeof fetch;

    await expect(service.currentWeather({})).rejects.toThrow(BadRequestException);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should throw ServiceUnavailableException when an OpenWeather key is a placeholder', async () => {
    setup({
      WEATHER_PROVIDERS: 'weatherapi,openweather',
      OPENWEATHER_API_KEY: 'your_openweathermap_api_key',
    });
    mockFetchByUrl((url) =>
      url.includes('api.weatherapi.com')
        ? Promise.resolve(weatherApiPayload)
        : Promise.reject(new Error('boom')),
    );

    const result = await service.currentWeather({ lat: 19.07, lng: 72.88 });

    expect(result.sources?.[1]).toMatchObject({ error: expect.stringContaining('OpenWeather') });
  });
});