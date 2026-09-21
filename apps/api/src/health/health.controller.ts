import { Controller, Get, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { Public } from '../auth/public.decorator';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Get()
  async check(@Res() res: Response) {
    const [database, ml, weather] = await Promise.all([
      this.pingDatabase(),
      this.pingMl(),
      this.pingWeather(),
    ]);

    const state = {
      backend: 'UP',
      database: database.status,
      ml: ml.status,
      weather: weather.status,
      weatherProviders: weather.providers,
      timestamp: new Date().toISOString(),
    };

    if (database.status !== 'UP' || ml.status === 'DOWN') {
      res.status(503);
    }
    res.json(state);
  }

  private async pingDatabase(): Promise<{ status: string }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'UP' };
    } catch {
      return { status: 'DOWN' };
    }
  }

  private async pingMl(): Promise<{ status: string }> {
    try {
      const base = this.config.get<string>('ML_SERVICE_URL') ?? 'http://localhost:8000';
      const token = this.config.get<string>('ML_API_TOKEN') ?? '';
      const timeoutMs = Number(
        this.config.get<string>('ML_HEALTH_TIMEOUT_MS') ?? '60000',
      );
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetch(`${base}/api/health`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      return { status: res.ok ? 'UP' : 'DOWN' };
    } catch {
      return { status: 'DOWN' };
    }
  }

  private pingWeather(): Promise<{ status: string; providers: string[] }> {
    const providers = (this.config.get<string>('WEATHER_PROVIDERS') ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    return Promise.resolve({
      status: providers.length > 0 ? 'UP' : 'UNCONFIGURED',
      providers,
    });
  }
}