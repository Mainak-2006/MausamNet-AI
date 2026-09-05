import { Controller, Get, Query } from '@nestjs/common';
import { WeatherService } from './weather.service';
import { WeatherQueryDto } from './dto/weather-query.dto';

@Controller('weather')
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  @Get('current')
  async current(@Query() query: WeatherQueryDto) {
    return this.weatherService.currentWeather(query);
  }

  @Get('forecast')
  async forecast(@Query() query: WeatherQueryDto) {
    return this.weatherService.forecast(query);
  }
}