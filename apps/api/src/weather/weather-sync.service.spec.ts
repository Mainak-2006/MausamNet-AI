import { WeatherEvent, ReportSource } from '@mausamnet/shared';
import { WeatherSyncService } from './weather-sync.service';
import type { WeatherCurrent, WeatherLocation } from '@mausamnet/shared';

describe('WeatherSyncService', () => {
  let service: WeatherSyncService;

  const weatherService = {
    currentWeather: jest.fn(),
  };
  const reportsService = {
    create: jest.fn(),
  };
  const configService = {
    get: jest.fn((key: string, defaultValue?: string) => defaultValue),
  };
  const reportRepository = {
    createQueryBuilder: jest.fn(),
  };
  const userRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const location: WeatherLocation = {
    name: 'Mumbai',
    country: 'India',
    latitude: 19.076,
    longitude: 72.8777,
  };

  const makeCurrent = (
    overrides: Partial<WeatherCurrent> = {},
  ): WeatherCurrent => ({
    temperature: 28,
    feelsLike: 30,
    humidity: 70,
    windSpeed: 12,
    precipitation: 0,
    weatherCode: 1000,
    condition: 'Sunny',
    recordedAt: '2026-09-05T12:00:00.000Z',
    ...overrides,
  });

  const makeWeatherResponse = (current: WeatherCurrent) => ({
    provider: 'weatherapi',
    location,
    current,
    forecast: [],
  });

  const makeQueryBuilder = (overrides: {
    getOne?: () => Promise<unknown>;
    getRawMany?: () => Promise<unknown[]>;
  } = {}) => ({
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    addGroupBy: jest.fn().mockReturnThis(),
    getOne: jest.fn().mockResolvedValue(null),
    getRawMany: jest.fn().mockResolvedValue([]),
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();

    weatherService.currentWeather.mockResolvedValue(
      makeWeatherResponse(makeCurrent()),
    );
    reportsService.create.mockResolvedValue({ id: 'report-1' });
    userRepository.findOne.mockResolvedValue({ id: 'system-user-1' });
    userRepository.create.mockImplementation((user) => user);
    userRepository.save.mockImplementation((user) => user);
    reportRepository.createQueryBuilder.mockReturnValue(makeQueryBuilder());

    service = new WeatherSyncService(
      weatherService as never,
      reportsService as never,
      configService as never,
      reportRepository as never,
      userRepository as never,
    );
  });

  describe('syncAll', () => {
    it('creates a heatwave report when temperature exceeds the threshold', async () => {
      weatherService.currentWeather.mockResolvedValue(
        makeWeatherResponse(
          makeCurrent({ temperature: 45, feelsLike: 48, condition: 'Clear' }),
        ),
      );

      const result = await service.syncAll();

      expect(result.reportsCreated).toBeGreaterThan(0);
      expect(reportsService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          city: 'Mumbai',
          state: 'Maharashtra',
          eventType: WeatherEvent.HEATWAVE,
          source: ReportSource.OPENWEATHER,
          country: 'India',
          latitude: 19.076,
          longitude: 72.8777,
        }),
        'system-user-1',
      );
    });

    it('creates a rainfall report when precipitation crosses the threshold', async () => {
      weatherService.currentWeather.mockResolvedValue(
        makeWeatherResponse(
          makeCurrent({ precipitation: 12, condition: 'Light rain' }),
        ),
      );

      const result = await service.syncAll();

      expect(result.reportsCreated).toBeGreaterThan(0);
      expect(reportsService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          city: 'Mumbai',
          eventType: WeatherEvent.RAINFALL,
        }),
        'system-user-1',
      );
    });

    it('creates a thunderstorm report for thunderstorm weather codes', async () => {
      weatherService.currentWeather.mockResolvedValue(
        makeWeatherResponse(
          makeCurrent({
            weatherCode: 1276,
            condition: 'Moderate or heavy rain with thunder',
            precipitation: 8,
          }),
        ),
      );

      const result = await service.syncAll();

      expect(result.reportsCreated).toBeGreaterThan(0);
      expect(reportsService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          city: 'Mumbai',
          eventType: WeatherEvent.THUNDERSTORM,
        }),
        'system-user-1',
      );
    });

    it('does not create reports for benign conditions', async () => {
      weatherService.currentWeather.mockResolvedValue(
        makeWeatherResponse(makeCurrent()),
      );

      const result = await service.syncAll();

      expect(result.reportsCreated).toBe(0);
      expect(reportsService.create).not.toHaveBeenCalled();
    });

    it('skips report creation when a recent report for the same city and event exists', async () => {
      weatherService.currentWeather.mockResolvedValue(
        makeWeatherResponse(
          makeCurrent({ temperature: 45, feelsLike: 48 }),
        ),
      );
      reportRepository.createQueryBuilder.mockReturnValue(
        makeQueryBuilder({ getOne: () => Promise.resolve({ id: 'existing' }) }),
      );

      const result = await service.syncAll();

      expect(result.skippedDuplicates).toBeGreaterThan(0);
      expect(result.reportsCreated).toBe(0);
      expect(reportsService.create).not.toHaveBeenCalled();
    });

    it('flags errors when the weather provider fails and continues with other cities', async () => {
      weatherService.currentWeather.mockRejectedValue(
        new Error('provider unreachable'),
      );

      const result = await service.syncAll();

      expect(result.errors).toBeGreaterThan(0);
      expect(result.reportsCreated).toBe(0);
    });
  });
});