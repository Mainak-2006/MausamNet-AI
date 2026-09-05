const TOKEN_PERSIST_KEY = 'mausamnet-auth';

function getPersistedAuth(): { token?: string } | null {
  try {
    const raw = localStorage.getItem(TOKEN_PERSIST_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.state ?? null;
  } catch {
    return null;
  }
}

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return getPersistedAuth()?.token ?? null;
}