import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { AlertSeverity } from '@mausamnet/shared';

export class CreateAlertDto {
  @IsUUID()
  reportId: string;

  @IsString()
  @MinLength(5)
  @MaxLength(500)
  title: string;

  @IsString()
  @MinLength(10)
  message: string;

  @IsOptional()
  @IsEnum(AlertSeverity)
  severity?: AlertSeverity;
}