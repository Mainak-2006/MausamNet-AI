/** @type {import('next').NextConfig} */
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const webDir = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(webDir, '../../.env') });

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3002';
const apiWs = apiUrl.replace(/^http/, 'ws');
const supabaseOrigin = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(
  /\/+$/,
  '',
);
const connectOrigins = [
  ...new Set([
    "'self'",
    'https:',
    apiUrl,
    apiWs,
    'http://localhost:3002',
    'http://127.0.0.1:3002',
    'ws://localhost:3002',
    'ws://127.0.0.1:3002',
  ]),
];

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  { key: 'X-Frame-Options', value: 'DENY' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(self)',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://*.tile.openstreetmap.org https://*.tile.stamen.com" + (supabaseOrigin ? ` ${supabaseOrigin}` : ''),
      `media-src 'self'${supabaseOrigin ? ` ${supabaseOrigin}` : ''}`,
      `connect-src ${connectOrigins.join(' ')}`,
      "font-src 'self' data:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join('; '),
  },
];

const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;