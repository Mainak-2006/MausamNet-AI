import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import {
  ReportSource,
  UserRole,
  WeatherEvent,
} from '@mausamnet/shared';
import type { WeatherCurrent, WeatherLocation } from '@mausamnet/shared';
import { WeatherService } from './weather.service';
import { MAJOR_INDIA_CITIES, inferIndianState } from './india-cities';
import { ReportsService } from '../reports/reports.service';
import { Report } from '../entities/report.entity';
import { User } from '../entities/user.entity';
import { CreateReportDto } from '../reports/dto/report.dto';

const SYSTEM_WEATHER_EMAIL = 'weather-system@mausamnet.ai';
const SYSTEM_WEATHER_NAME = 'Weather System';

const THRESHOLDS = {
  rainfall: 5, // mm
  flood: 30, // mm
  heatwave: 42, // °C
  strongWind: 60, // km/h
} as const;

const WEATHERAPI_THUNDERSTORM_CODES = [1087, 1273, 1276, 1279, 1282];

const SYNC_DEDUP_WINDOW_MS = 60 * 60 * 1000;

interface SyncCity {
  name: string;
  state: string;
}

export interface WeatherSyncResult {
  citiesChecked: number;
  eventsDetected: number;
  reportsCreated: number;
  skippedDuplicates: number;
  errors: number;
  details: Array<{
    city: string;
    state: string;
    eventType: WeatherEvent | null;
    status: 'report_created' | 'skipped_duplicate' | 'no_event' | 'error';
    message?: string;
  }>;
}

interface DetectedEvent {
  eventType: WeatherEvent;
  title: string;
  description: string;
}

@Injectable()
export class WeatherSyncService {
  private readonly logger = new Logger(WeatherSyncService.name);
  private readonly syncEnabled: boolean;

  constructor(
    private readonly weatherService: WeatherService,
    private readonly reportsService: ReportsService,
    private readonly configService: ConfigService,
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    this.syncEnabled =
      this.configService.get<string>('WEATHER_SYNC_ENABLED', 'true') !== 'false';
  }

  @Cron(CronExpression.EVERY_30_MINUTES)
  async handleCron(): Promise<void> {
    if (!this.syncEnabled) {
      return;
    }

    this.logger.log('Starting scheduled weather data sync');
    const result = await this.syncAll();
    this.logger.log(
      `Weather sync complete: ${result.reportsCreated} reports created, ${result.skippedDuplicates} duplicates skipped, ${result.errors} errors`,
    );
  }

  async syncAll(): Promise<WeatherSyncResult> {
    const systemUserId = await this.ensureSystemUser();
    const cities = await this.buildCityList();

    const result: WeatherSyncResult = {
      citiesChecked: cities.length,
      eventsDetected: 0,
      reportsCreated: 0,
      skippedDuplicates: 0,
      errors: 0,
      details: [],
    };

    for (const city of cities) {
      const detail = await this.syncCity(city, systemUserId);
      result.details.push(detail);

      if (detail.status === 'report_created') {
        result.eventsDetected += 1;
        result.reportsCreated += 1;
      } else if (detail.status === 'skipped_duplicate') {
        result.skippedDuplicates += 1;
      } else if (detail.status === 'error') {
        result.errors += 1;
      }
    }

    return result;
  }

  private async syncCity(
    city: SyncCity,
    systemUserId: string,
  ): Promise<WeatherSyncResult['details'][number]> {
    try {
      const weather = await this.weatherService.currentWeather({
        city: city.name,
      });

      const event = this.detectEvent(weather.location, weather.current);

      if (!event) {
        return {
          city: city.name,
          state: city.state,
          eventType: null,
          status: 'no_event',
        };
      }

      const alreadySynced = await this.findRecentReport(
        city.name,
        event.eventType,
      );

      if (alreadySynced) {
        return {
          city: city.name,
          state: city.state,
          eventType: event.eventType,
          status: 'skipped_duplicate',
        };
      }

      const provider =
        weather.provider === 'multi' ? 'openweather' : weather.provider;

      const dto: CreateReportDto = {
        title: event.title,
        description: event.description,
        eventType: event.eventType,
        latitude: weather.location.latitude,
        longitude: weather.location.longitude,
        city: city.name,
        state: city.state,
        country: 'India',
        source: ReportSource.OPENWEATHER,
        sourceUrl: this.buildSourceUrl(provider, city.name),
        reportDate: new Date().toISOString(),
      };

      await this.reportsService.create(dto, systemUserId);

      return {
        city: city.name,
        state: city.state,
        eventType: event.eventType,
        status: 'report_created',
      };
    } catch (error) {
      this.logger.warn(
        `Weather sync failed for ${city.name}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return {
        city: city.name,
        state: city.state,
        eventType: null,
        status: 'error',
        message: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private detectEvent(
    location: WeatherLocation,
    current: WeatherCurrent,
  ): DetectedEvent | null {
    const candidates: DetectedEvent[] = [];

    if (current.precipitation >= THRESHOLDS.flood) {
      candidates.push({
        eventType: WeatherEvent.FLOOD,
        title: `Flood risk in ${location.name}`,
        description: `Heavy precipitation of ${current.precipitation}mm recorded in ${location.name}. Immediate flood risk reported. Current conditions: ${current.condition}, temperature ${current.temperature}°C, humidity ${current.humidity}%, wind speed ${current.windSpeed} km/h.`,
      });
    }

    if (this.isThunderstormCode(current.weatherCode)) {
      candidates.push({
        eventType: WeatherEvent.THUNDERSTORM,
        title: `Thunderstorm detected in ${location.name}`,
        description: `Thunderstorm conditions observed in ${location.name}. Current conditions: ${current.condition}, temperature ${current.temperature}°C, precipitation ${current.precipitation}mm, wind speed ${current.windSpeed} km/h.`,
      });
    }

    if (current.windSpeed >= THRESHOLDS.strongWind) {
      candidates.push({
        eventType: WeatherEvent.STRONG_WIND,
        title: `Strong winds in ${location.name}`,
        description: `Wind speeds of ${current.windSpeed} km/h recorded in ${location.name}. Current conditions: ${current.condition}, temperature ${current.temperature}°C, humidity ${current.humidity}%, precipitation ${current.precipitation}mm.`,
      });
    }

    if (current.temperature >= THRESHOLDS.heatwave) {
      candidates.push({
        eventType: WeatherEvent.HEATWAVE,
        title: `Heatwave conditions in ${location.name}`,
        description: `Temperature reached ${current.temperature}°C in ${location.name}, feels like ${current.feelsLike}°C. Current conditions: ${current.condition}, humidity ${current.humidity}%, wind speed ${current.windSpeed} km/h.`,
      });
    }

    if (current.precipitation >= THRESHOLDS.rainfall) {
      candidates.push({
        eventType: WeatherEvent.RAINFALL,
        title: `Heavy rainfall in ${location.name}`,
        description: `Rainfall of ${current.precipitation}mm recorded in ${location.name}. Current conditions: ${current.condition}, temperature ${current.temperature}°C, humidity ${current.humidity}%, wind speed ${current.windSpeed} km/h.`,
      });
    }

    const severityOrder: WeatherEvent[] = [
      WeatherEvent.FLOOD,
      WeatherEvent.THUNDERSTORM,
      WeatherEvent.STRONG_WIND,
      WeatherEvent.HEATWAVE,
      WeatherEvent.RAINFALL,
    ];

    for (const eventType of severityOrder) {
      const candidate = candidates.find(
        (event) => event.eventType === eventType,
      );
      if (candidate) {
        return candidate;
      }
    }

    return null;
  }

  private isThunderstormCode(code: number | string): boolean {
    const numeric = Number(code);

    if (!Number.isInteger(numeric)) {
      return false;
    }

    return (
      (numeric >= 200 && numeric <= 232) ||
      WEATHERAPI_THUNDERSTORM_CODES.includes(numeric)
    );
  }

  private async findRecentReport(
    city: string,
    eventType: WeatherEvent,
  ): Promise<Report | null> {
    const since = new Date(Date.now() - SYNC_DEDUP_WINDOW_MS);

    return this.reportRepository
      .createQueryBuilder('report')
      .where('report.source = :source', { source: ReportSource.OPENWEATHER })
      .andWhere('report.eventType = :eventType', { eventType })
      .andWhere('LOWER(report.city) = LOWER(:city)', { city })
      .andWhere('report.reportDate >= :since', { since })
      .getOne();
  }

  private async ensureSystemUser(): Promise<string> {
    const existing = await this.userRepository.findOne({
      where: { email: SYSTEM_WEATHER_EMAIL },
    });

    if (existing) {
      return existing.id;
    }

    const password = randomBytes(32).toString('hex');
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = this.userRepository.create({
      email: SYSTEM_WEATHER_EMAIL,
      name: SYSTEM_WEATHER_NAME,
      password: hashedPassword,
      role: UserRole.CITIZEN,
    });

    const saved = await this.userRepository.save(user);
    this.logger.log(`Created system user for weather reports (${saved.id})`);
    return saved.id;
  }

  private async buildCityList(): Promise<SyncCity[]> {
    const cities = new Map<string, SyncCity>();

    for (const city of MAJOR_INDIA_CITIES) {
      cities.set(city.name.toLowerCase(), {
        name: city.name,
        state: city.state,
      });
    }

    const reportCities = await this.reportRepository
      .createQueryBuilder('report')
      .select('LOWER(report.city)', 'city')
      .addSelect('report.state', 'state')
      .where('report.city IS NOT NULL')
      .andWhere('report.state IS NOT NULL')
      .groupBy('LOWER(report.city)')
      .addGroupBy('report.state')
      .getRawMany<{ city: string; state: string }>();

    for (const row of reportCities) {
      if (!row?.city) {
        continue;
      }

      const inferredState =
        row.state ?? inferIndianState(row.city) ?? 'Unknown';

      const key = row.city.toLowerCase();
      if (!cities.has(key)) {
        cities.set(key, { name: row.city, state: inferredState });
      }
    }

    for (const city of MAJOR_INDIA_CITIES) {
      const key = city.name.toLowerCase();
      const current = cities.get(key);
      if (current) {
        current.state = city.state;
      }
    }

    return Array.from(cities.values());
  }

  private buildSourceUrl(
    provider: 'openweather' | 'weatherapi',
    city: string,
  ): string {
    if (provider === 'openweather') {
      return `https://openweathermap.org/city?q=${encodeURIComponent(city)}`;
    }

    return `https://www.weatherapi.com/weather?q=${encodeURIComponent(city)}`;
  }
}