import { NextResponse, type NextRequest } from 'next/server';
import { createClientServer } from '@/lib/supabase-server';

const OTP_TYPES = ['signup', 'recovery', 'email_change', 'email'] as const;
type OtpType = (typeof OTP_TYPES)[number];

function safeNext(raw: string | null): string {
  if (!raw) return '/dashboard';
  if (!raw.startsWith('/') || raw.startsWith('//')) return '/dashboard';
  return raw;
}

function toOtpType(raw: string | null): OtpType {
  return OTP_TYPES.includes(raw as OtpType) ? (raw as OtpType) : 'signup';
}

function fail(origin: string, message: string): NextResponse {
  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent(message)}`,
  );
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const next = safeNext(searchParams.get('next'));
  const oauthError =
    searchParams.get('error_description') ?? searchParams.get('error');

  if (oauthError) {
    return fail(origin, oauthError);
  }

  const supabase = createClientServer();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return fail(origin, error.message);
    return NextResponse.redirect(`${origin}${next}`);
  }

  if (tokenHash) {
    const { error } = await supabase.auth.verifyOtp({
      type: toOtpType(type),
      token_hash: tokenHash,
    });
    if (error) return fail(origin, error.message);
    return NextResponse.redirect(`${origin}${next}`);
  }

  return fail(origin, 'Verification link is missing or invalid');
}
