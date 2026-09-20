import { Type } from 'class-transformer';
import { IsLatitude, IsLongitude, IsOptional, IsString } from 'class-validator';

export class WeatherQueryDto {
  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsLatitude()
  @Type(() => Number)
  lat?: number;

  @IsOptional()
  @IsLongitude()
  @Type(() => Number)
  lon?: number;
}