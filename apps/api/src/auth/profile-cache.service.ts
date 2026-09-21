import { Injectable } from '@nestjs/common';
import { AuthedUser } from './types';

const PROFILE_CACHE_TTL_MS = 60_000;

interface CacheEntry {
  user: AuthedUser;
  expiresAt: number;
}

@Injectable()
export class ProfileCacheService {
  private readonly cache = new Map<string, CacheEntry>();

  get(authId: string): AuthedUser | undefined {
    const entry = this.cache.get(authId);
    if (!entry) return undefined;
    if (entry.expiresAt <= Date.now()) {
      this.cache.delete(authId);
      return undefined;
    }
    return entry.user;
  }

  set(authId: string, user: AuthedUser): void {
    this.cache.set(authId, {
      user,
      expiresAt: Date.now() + PROFILE_CACHE_TTL_MS,
    });
  }

  invalidate(authId: string): void {
    this.cache.delete(authId);
  }
}