import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { ProfileCacheService } from './profile-cache.service';
import { SupabaseAuthGuard } from './supabase.guard';
import { RolesGuard } from './roles.guard';
import { PasswordResetService } from './password-reset.service';

@Module({
  providers: [
    AuthService,
    SupabaseAuthGuard,
    RolesGuard,
    PasswordResetService,
    ProfileCacheService,
  ],
  controllers: [AuthController],
  exports: [SupabaseAuthGuard, RolesGuard, ProfileCacheService],
})
export class AuthModule {}