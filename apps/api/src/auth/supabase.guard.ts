import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { importJWK, jwtVerify, type JWK } from 'jose';
import { PrismaService } from '../prisma/prisma.service';
import { IS_PUBLIC_KEY } from './public.decorator';
import { AuthedUser, JwtClaim } from './types';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<{ user?: AuthedUser }>();
    const token = this.extractToken(context);
    if (!token) throw new UnauthorizedException('Missing bearer token');

    try {
      const payload = await this.verifyToken(token);
      const user = await this.syncProfile(payload);
      request.user = user;
      return true;
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private extractToken(context: ExecutionContext): string | undefined {
    const request = context
      .switchToHttp()
      .getRequest<{ headers: Record<string, string> }>();
    const header = request.headers['authorization'] ?? '';
    const [scheme, token] = header.split(' ');
    return scheme === 'Bearer' && token ? token : undefined;
  }

  private async verifyToken(token: string): Promise<JwtClaim> {
    const secret = this.config.get<string>('SUPABASE_JWT_SECRET') ?? '';
    const parsed = await this.tryParseJwks(secret);
    if (parsed) {
      const { payload } = await jwtVerify(token, parsed, {
        algorithms: ['ES256'],
      });
      return payload as unknown as JwtClaim;
    }
    const key = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'] });
    return payload as unknown as JwtClaim;
  }

  private async tryParseJwks(secret: string): Promise<CryptoKey | null> {
    try {
      const doc = JSON.parse(secret) as { keys?: Array<Record<string, string>> };
      const key = doc.keys?.find((k) => k.kty === 'EC' || k.kty === 'RSA');
      if (!key) return null;
      return (await importJWK(key as unknown as JWK, 'ES256')) as CryptoKey;
    } catch {
      return null;
    }
  }

  private async syncProfile(payload: JwtClaim): Promise<AuthedUser> {
    const authId = payload.sub;
    const email = payload.email?.toLowerCase();
    const meta = payload.user_metadata ?? {};
    const name =
      meta.name ?? meta.full_name ?? meta.first_name
        ? [meta.first_name, meta.last_name].filter(Boolean).join(' ')
        : email;
    const avatarUrl =
      meta.avatar_url ?? payload.app_metadata?.['avatar_url'] ?? null;

    if (!authId || !email) throw new UnauthorizedException('Invalid token claims');

    const created = await this.prisma.profile.upsert({
      where: { authId },
      create: {
        authId,
        email,
        name: name ?? email,
        avatarUrl: avatarUrl ? String(avatarUrl) : null,
        role: Role.USER,
      },
      update: {
        email,
        name: name ?? undefined,
        avatarUrl: avatarUrl ? String(avatarUrl) : undefined,
      },
    });

    if (created.suspended || created.banned) {
      throw new UnauthorizedException('Account suspended');
    }

    return {
      id: created.id,
      authId: created.authId,
      email: created.email,
      name: created.name,
      role: created.role,
      credibilityScore: created.credibilityScore,
    };
  }
}