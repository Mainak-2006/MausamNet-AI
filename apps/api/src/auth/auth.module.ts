import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { SupabaseAuthGuard } from './supabase.guard';
import { RolesGuard } from './roles.guard';
import { PasswordResetService } from './password-reset.service';

@Module({
  providers: [AuthService, SupabaseAuthGuard, RolesGuard, PasswordResetService],
  controllers: [AuthController],
  exports: [SupabaseAuthGuard, RolesGuard],
})
export class AuthModule {}