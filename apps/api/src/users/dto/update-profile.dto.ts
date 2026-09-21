import {
  IsOptional,
  IsString,
  IsUrl,
  IsAlphanumeric,
  Matches,
  MinLength,
  MaxLength,
} from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsAlphanumeric()
  @MinLength(3)
  @MaxLength(30)
  username?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @Matches(/^[\p{L}\s.'-]+$/u)
  @MaxLength(60)
  city?: string;

  @IsOptional()
  @Matches(/^[\p{L}\s.'-]+$/u)
  @MaxLength(60)
  state?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  avatarUrl?: string;
}