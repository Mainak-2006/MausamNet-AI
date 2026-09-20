export interface AuthedUser {
  id: string;
  authId: string;
  email: string;
  name: string | null;
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  credibilityScore: number;
}

export type MlMethod = 'model' | 'keyword' | 'fallback';

export interface MlPrediction {
  category: 'RAINFALL' | 'HEAVY_RAINFALL' | 'FLOOD' | 'FLASH_FLOOD' | 'THUNDERSTORM' | 'LIGHTNING' | 'CYCLONE' | 'HEATWAVE' | 'COLD_WAVE' | 'FOG' | 'DENSE_FOG' | 'DUST_STORM' | 'STRONG_WIND' | 'HAILSTORM' | 'SNOWFALL' | 'DROUGHT' | 'LANDSLIDE' | 'CLOUDBURST' | 'WATERLOGGING' | 'OTHER' | null;
  confidence: number | null;
  trustScore: number | null;
  method: MlMethod | null;
}

export interface JwtClaim {
  sub: string;
  email?: string;
  user_metadata?: {
    name?: string;
    full_name?: string;
    avatar_url?: string;
    first_name?: string;
    last_name?: string;
  };
  email_verified?: boolean;
  role?: string;
  app_metadata?: Record<string, unknown>;
}