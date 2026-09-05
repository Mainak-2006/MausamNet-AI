import { Controller, Post } from '@nestjs/common';
import { UserRole } from '@mausamnet/shared';
import { Roles } from '../auth/decorators/roles.decorator';
import { WeatherSyncService } from './weather-sync.service';

@Controller('weather')
export class WeatherSyncController {
  constructor(private readonly weatherSyncService: WeatherSyncService) {}

  @Post('sync')
  @Roles(UserRole.ADMIN)
  async sync() {
    return this.weatherSyncService.syncAll();
  }
}