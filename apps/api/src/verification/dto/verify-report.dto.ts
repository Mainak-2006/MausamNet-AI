import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { VerificationStatus } from '@mausamnet/shared';

export class CreateVerificationDto {
  @IsUUID()
  reportId: string;

  @IsEnum(VerificationStatus)
  status: VerificationStatus;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}