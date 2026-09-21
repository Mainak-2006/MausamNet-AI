import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { Prisma, Role } from '@prisma/client';
import {
  decodeProtectedHeader,
  importJWK,
  jwtVerify,
  type JWK,
} from 'jose';
import { PrismaService } from '../prisma/prisma.service';
import { IS_PUBLIC_KEY } from './public.decorator';
import { ProfileCacheService } from './profile-cache.service';
import { AuthedUser, JwtClaim } from './types';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly profileCache: ProfileCacheService,
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
    const supabaseUrl = this.config.get<string>('SUPABASE_URL');
    const issuer = supabaseUrl
      ? `${supabaseUrl.replace(/\/+$/, '')}/auth/v1`
      : undefined;

    const jwks = this.tryParseJwks(secret);
    if (jwks) {
      return this.verifyWithJwks(token, jwks.keys, issuer);
    }

    const key = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(token, key, {
      algorithms: ['HS256'],
      ...(issuer ? { issuer } : {}),
      audience: 'authenticated',
    });
    return payload as unknown as JwtClaim;
  }

  private async verifyWithJwks(
    token: string,
    keys: Array<Record<string, string>>,
    issuer?: string,
  ): Promise<JwtClaim> {
    let header: { kid?: string; alg?: string };
    try {
      header = decodeProtectedHeader(token);
    } catch {
      throw new UnauthorizedException('Invalid bearer token');
    }

    const fallback = keys.find((k) => k.kty === 'EC' || k.kty === 'RSA');
    const key = header.kid
      ? (keys.find((k) => k.kid === header.kid) ?? fallback)
      : fallback;
    if (!key) throw new UnauthorizedException('Invalid or expired token');

    const alg = key.kty === 'RSA' ? 'RS256' : 'ES256';
    const cryptoKey = (await importJWK(key as unknown as JWK, alg)) as CryptoKey;
    const { payload } = await jwtVerify(token, cryptoKey, {
      algorithms: [alg],
      ...(issuer ? { issuer } : {}),
      audience: 'authenticated',
    });
    return payload as unknown as JwtClaim;
  }

  private tryParseJwks(
    secret: string,
  ): { keys: Array<Record<string, string>> } | null {
    try {
      const doc = JSON.parse(secret) as { keys?: Array<Record<string, string>> };
      if (!doc.keys?.length) return null;
      return { keys: doc.keys };
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

    const cached = this.profileCache.get(authId);
    if (cached) return cached;

    const profile = await this.upsertProfile(
      authId,
      email,
      name ?? email,
      avatarUrl ? String(avatarUrl) : null,
    );

    if (profile.suspended || profile.banned) {
      throw new UnauthorizedException('Account suspended');
    }

    const user: AuthedUser = {
      id: profile.id,
      authId: profile.authId,
      email: profile.email,
      name: profile.name,
      role: profile.role,
      credibilityScore: profile.credibilityScore,
    };
    this.profileCache.set(authId, user);
    return user;
  }

  private async upsertProfile(
    authId: string,
    email: string,
    name: string,
    avatarUrl: string | null,
  ) {
    try {
      return await this.prisma.profile.upsert({
        where: { authId },
        create: {
          authId,
          email,
          name,
          avatarUrl,
          role: Role.USER,
        },
        update: {
          email,
          name,
          avatarUrl: avatarUrl ?? undefined,
        },
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        const existing = await this.prisma.profile.findUnique({
          where: { authId },
        });
        if (!existing) throw err;
        return this.prisma.profile.update({
          where: { authId },
          data: { email, name, avatarUrl: avatarUrl ?? undefined },
        });
      }
      throw err;
    }
  }
}