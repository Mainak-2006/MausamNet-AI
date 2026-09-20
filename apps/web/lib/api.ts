export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3002';

export async function apiFetch<T = unknown>(
  path: string,
  options: { method?: string; body?: unknown; token?: string | null } = {},
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'content-type': 'application/json',
      ...(options.token ? { authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: 'no-store',
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (typeof data?.message === 'string') message = data.message;
      else if (Array.isArray(data?.message)) message = data.message.join(', ');
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }

  return (await res.json()) as T;
}