import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ReportSource } from '@mausamnet/shared';

export class ScoreCredibilityDto {
  @IsString()
  @MinLength(10)
  @MaxLength(3000)
  text: string;

  @IsEnum(ReportSource)
  source: ReportSource;

  @IsOptional()
  @IsBoolean()
  hasMedia?: boolean;

  @IsOptional()
  @IsBoolean()
  hasLocation?: boolean;

  @IsOptional()
  @IsUUID()
  reportId?: string;
}