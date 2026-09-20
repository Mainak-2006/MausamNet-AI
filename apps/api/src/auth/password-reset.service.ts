import {
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

const RESET_TOKEN_TTL_MS = 1000 * 60 * 30;

@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);
  private supabaseAdmin: SupabaseClient | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private admin(): SupabaseClient {
    if (this.supabaseAdmin) return this.supabaseAdmin;
    const url = this.config.get<string>('SUPABASE_URL');
    const key = this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !key) {
      throw new BadRequestException('Password reset is not configured');
    }
    this.supabaseAdmin = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    return this.supabaseAdmin;
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async requestReset(dto: ForgotPasswordDto) {
    const email = dto.email.toLowerCase().trim();
    const profile = await this.prisma.profile.findUnique({ where: { email } });

    if (profile) {
      const token = randomBytes(32).toString('hex');
      await this.prisma.passwordResetToken.create({
        data: {
          token: this.hashToken(token),
          userId: profile.id,
          expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
        },
      });

      const origin =
        this.config.get<string>('APP_ORIGIN') ?? 'http://localhost:3000';
      const redirectTo =
        `${origin}/reset-password?email=${encodeURIComponent(email)}` +
        `&token=${encodeURIComponent(token)}`;

      try {
        await this.admin().auth.resetPasswordForEmail(email, { redirectTo });
      } catch (err) {
        this.logger.error(`Failed to send reset email: ${String(err)}`);
      }
    }

    return {
      message: 'If that email is registered, a password reset link has been sent.',
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const email = dto.email.toLowerCase().trim();
    const record = await this.prisma.passwordResetToken.findFirst({
      where: { token: this.hashToken(dto.token), used: false },
      include: { user: true },
    });

    if (!record || record.user.email !== email) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (record.expiresAt < new Date()) {
      throw new BadRequestException('Reset token has expired');
    }

    await this.admin().auth.admin.updateUserById(record.user.authId, {
      password: dto.newPassword,
    });

    await this.prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { used: true },
    });

    return { message: 'Password updated successfully. You can now log in.' };
  }
}