export const REQUIRED_IN_PRODUCTION = [
  'DATABASE_URL',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_JWT_SECRET',
  'ML_API_TOKEN',
  'APP_ORIGIN',
];

/**
 * Fail-fast validation for the API config. In production every critical
 * variable must be present, otherwise the service refuses to boot instead of
 * silently falling back to a dev default.
 */
export function validateEnv(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const env = { ...config };
  const isProd = env.NODE_ENV === 'production';

  if (isProd) {
    const missing = REQUIRED_IN_PRODUCTION.filter(
      (key) => !env[key] || String(env[key]).trim() === '',
    );
    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variable(s): ${missing.join(', ')}`,
      );
    }
  }

  return env;
}