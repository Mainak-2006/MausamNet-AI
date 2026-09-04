import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsDateString,
  MinLength,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { WeatherEvent, ReportSource, VerificationStatus } from '@mausamnet/shared';

export class CreateReportDto {
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  title: string;

  @IsString()
  @MinLength(10)
  description: string;

  @IsEnum(WeatherEvent)
  eventType: WeatherEvent;

  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @IsString()
  @MinLength(2)
  @MaxLength(255)
  city: string;

  @IsString()
  @MinLength(2)
  @MaxLength(255)
  state: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  country?: string;

  @IsOptional()
  @IsEnum(ReportSource)
  source?: ReportSource;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  sourceUrl?: string;

  @IsDateString()
  reportDate: string;
}

export class UpdateReportDto {
  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  description?: string;

  @IsOptional()
  @IsEnum(WeatherEvent)
  eventType?: WeatherEvent;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsDateString()
  reportDate?: string;
}

export class FilterReportsDto {
  @IsOptional()
  @IsNumber()
  page?: number;

  @IsOptional()
  @IsNumber()
  limit?: number;

  @IsOptional()
  @IsEnum(WeatherEvent)
  eventType?: WeatherEvent;

  @IsOptional()
  @IsEnum(VerificationStatus)
  verificationStatus?: VerificationStatus;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC';
}

export class VerifyReportDto {
  @IsEnum(VerificationStatus)
  status: VerificationStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}