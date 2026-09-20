import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { Role } from '@prisma/client';

export class NoteDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

export class UpdateRoleDto {
  @IsEnum(Role)
  role: Role | undefined;
}

export class AdminUsersQueryDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  role?: string;
}