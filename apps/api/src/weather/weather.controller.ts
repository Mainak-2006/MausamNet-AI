import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Public } from '../auth/public.decorator';
import { Roles } from '../auth/roles.decorator';
import { WeatherQueryDto } from './dto/weather-query.dto';
import { WeatherService } from './weather.service';

@ApiTags('weather')
@Controller('weather')
export class WeatherController {
  constructor(private readonly weather: WeatherService) {}

  @Public()
  @Get('current')
  current(@Query() query: WeatherQueryDto) {
    return this.weather.getCurrent(query);
  }

  @Public()
  @Get('city/:city')
  city(@Param('city') city: string) {
    return this.weather.getCurrent({ city });
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Post('sync')
  sync(@Query() query: WeatherQueryDto) {
    return this.weather.syncSnapshot(query);
  }

  @Public()
  @Get('providers')
  providers() {
    return this.weather.providersStatus();
  }
}