import { getAuthToken } from './api/token';
import type { ApiError } from './api/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function buildHeaders(extra?: HeadersInit): Headers {
  const headers = new Headers(extra);
  if (!headers.has('Accept')) headers.set('Accept', 'application/json');
  const token = getAuthToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return headers;
}

async function parseError(
  res: Response,
  fallback: string,
): Promise<ApiError> {
  let message = fallback;
  try {
    const body = await res.json();
    if (typeof body?.message === 'string') message = body.message;
    else if (Array.isArray(body?.message)) {
      message = body.message.map((m: unknown) => String(m)).join(', ');
    }
  } catch {
    // ignore body parse failure
  }
  return { status: res.status, message };
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  const res = await fetch(url, { ...options, headers: buildHeaders(options.headers) });

  if (!res.ok) {
    throw await parseError(res, `Request failed (${res.status})`);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export function apiGet<T>(path: string, query?: object): Promise<T> {
  const url = query ? `${path}?${new URLSearchParams(
    Object.entries(query).flatMap(([k, v]) =>
      v === undefined || v === null || v === '' ? [] : [[k, String(v)]],
    ),
  ).toString()}` : path;
  return request<T>(url);
}

export function apiPost<T>(
  path: string,
  body?: unknown,
  options: RequestInit = {},
): Promise<T> {
  return request<T>(path, {
    method: 'POST',
    headers: body instanceof FormData ? undefined : { 'Content-Type': 'application/json' },
    body: body instanceof FormData ? body : body === undefined ? undefined : JSON.stringify(body),
    ...options,
  });
}

export function apiPatch<T>(
  path: string,
  body?: unknown,
): Promise<T> {
  return request<T>(path, {
    method: 'PATCH',
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export function apiDelete<T>(path: string): Promise<T> {
  return request<T>(path, { method: 'DELETE' });
}

export const api = {
  get: apiGet,
  post: apiPost,
  patch: apiPatch,
  delete: apiDelete,
};

export { API_BASE };