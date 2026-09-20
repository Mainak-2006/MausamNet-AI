import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

export function useGet<T>(path: string, token?: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiFetch<T>(path, { token });
      setData(res);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  }, [path, token]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, reload: load };
}

export function useMutation() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async <T,>(
      path: string,
      options: { method?: string; body?: unknown; token?: string | null },
    ): Promise<T> => {
      try {
        setSubmitting(true);
        setError(null);
        return await apiFetch<T>(path, {
          method: options.method ?? 'POST',
          body: options.body as never,
          token: options.token,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Request failed');
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [],
  );

  return { submitting, error, run };
}