import { IsEmail, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';
import { UserRole } from '@mausamnet/shared';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}

export class LoginUserDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}