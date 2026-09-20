import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const envPath = path.join(root, '.env');

function parseEnv(file) {
  const out = {};
  if (!fs.existsSync(file)) return out;
  for (const raw of fs.readFileSync(file, 'utf8').split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

const env = parseEnv(envPath);
const details = [];

if (env.DB_HOST && env.DB_USERNAME && env.DB_PASSWORD) {
  const dbName = env.DB_DATABASE ?? 'postgres';
  const dbPort = env.DB_PORT ?? '6543';
  const user = encodeURIComponent(env.DB_USERNAME);
  const pass = encodeURIComponent(env.DB_PASSWORD);
  env.DATABASE_URL = `postgresql://${user}:${pass}@${env.DB_HOST}:${dbPort}/${dbName}?pgbouncer=true&sslmode=require`;
  env.DIRECT_DATABASE_URL = `postgresql://${user}:${pass}@${env.DB_HOST}:5432/${dbName}?sslmode=require`;
  details.push('DATABASE_URL + DIRECT_DATABASE_URL derived from DB_* vars');

  const ref = env.DB_USERNAME.includes('.')
    ? env.DB_USERNAME.split('.')[1]
    : env.DB_HOST.split('.')[0];
  if (ref) {
    env.SUPABASE_URL ??= `https://${ref}.supabase.co`;
    details.push(`SUPABASE_URL defaulted to ${env.SUPABASE_URL}`);
  }
}

if (!env.ANON_KEY_PRESENT && (env.SUPABASE_ANON_KEY ?? '').toUpperCase().startsWith('YOUR')) {
  details.push('WARNING: SUPABASE_ANON_KEY is a placeholder — replace it in .env');
}

function serialize(entries) {
  return entries
    .map(([key, value]) => {
      const needsQuotes =
        value.includes('\n') ||
        value.includes(' ') ||
        /^[\[{]/.test(value.trim());
      return `${key}=${needsQuotes ? `'${value}'` : value}`;
    })
    .join('\n') + '\n';
}

const apiEnvPath = path.join(root, 'apps/api/.env');
const sortedApi = Object.entries(env).sort(([a], [b]) => a.localeCompare(b));
fs.writeFileSync(apiEnvPath, serialize(sortedApi));
details.push(`wrote ${path.relative(root, apiEnvPath)} (${sortedApi.length} vars)`);

const webEntries = [
  ['NEXT_PUBLIC_API_URL', env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3002'],
  ['NEXT_PUBLIC_SUPABASE_URL', env.SUPABASE_URL ?? ''],
  ['NEXT_PUBLIC_SUPABASE_ANON_KEY', env.SUPABASE_ANON_KEY ?? ''],
  [
    'NEXT_PUBLIC_MAP_TILE_URL',
    env.NEXT_PUBLIC_MAP_TILE_URL ??
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  ],
];
const webEnvPath = path.join(root, 'apps/web/.env.local');
fs.writeFileSync(webEnvPath, serialize(webEntries));
details.push(`wrote ${path.relative(root, webEnvPath)}`);

console.log(details.join('\n'));