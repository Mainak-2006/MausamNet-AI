import {
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class ClassifyReportDto {
  @IsString()
  @MinLength(10)
  @MaxLength(3000)
  text: string;

  @IsOptional()
  @IsUUID()
  reportId?: string;
}