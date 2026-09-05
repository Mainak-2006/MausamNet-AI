import { apiDelete, apiGet, apiPatch, apiPost } from './api';

const TOKEN_KEY = 'mausamnet-auth';

function setStoredToken(token: string | null) {
  if (token === null) {
    localStorage.removeItem(TOKEN_KEY);
    return;
  }
  localStorage.setItem(
    TOKEN_KEY,
    JSON.stringify({ state: { token, user: null } }),
  );
}

const jsonResponse = (body: unknown, status = 200): Response =>
  ({
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers({ 'Content-Type': 'application/json' }),
    json: async () => body,
  }) as unknown as Response;

describe('api client', () => {
  const fetchMock = jest.fn();
  const originalFetch = global.fetch;

  beforeEach(() => {
    localStorage.clear();
    global.fetch = fetchMock as unknown as typeof fetch;
    fetchMock.mockReset();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it('calls the backend under http://localhost:3001 by default', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true }));
    await apiGet('/api/reports');
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3001/api/reports',
      expect.objectContaining({ headers: expect.any(Headers) }),
    );
  });

  it('attaches the JWT as a Bearer token', async () => {
    setStoredToken('test-jwt');
    fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true }));
    await apiGet('/api/reports');
    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = options.headers as Headers;
    expect(headers.get('Authorization')).toBe('Bearer test-jwt');
  });

  it('serializes query params and drops empty/undefined values', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ data: [], total: 0 }));
    await apiGet('/api/reports', {
      page: 2,
      limit: 20,
      eventType: '',
      city: undefined,
      sortOrder: 'DESC',
    });
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain('page=2');
    expect(url).toContain('limit=20');
    expect(url).toContain('sortOrder=DESC');
    expect(url).not.toContain('eventType');
    expect(url).not.toContain('city');
  });

  it('parses JSON on success', async () => {
    const payload = { id: 'abc', title: 'Heavy rain' };
    fetchMock.mockResolvedValueOnce(jsonResponse(payload));
    const result = await apiGet('/api/reports/abc');
    expect(result).toEqual(payload);
  });

  it('throws an ApiError with the backend message on failure', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ message: 'Invalid credentials' }, 401),
    );
    await expect(apiGet('/api/auth/profile')).rejects.toMatchObject({
      status: 401,
      message: 'Invalid credentials',
    });
  });

  it('falls back to a generic message when body has no message', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({}, 500));
    await expect(apiGet('/api/reports')).rejects.toMatchObject({
      status: 500,
      message: 'Request failed (500)',
    });
  });

  it('POST sends a JSON body with the content-type header', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ created: true }, 201));
    const body = { title: 'New report' };
    await apiPost('/api/reports', body);
    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body as string)).toEqual(body);
    const headers = options.headers as Headers;
    expect(headers.get('Content-Type')).toBe('application/json');
  });

  it('PATCH sets method and body', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true }));
    await apiPatch('/api/reports/1', { title: 'Updated' });
    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(options.method).toBe('PATCH');
    expect(JSON.parse(options.body as string)).toEqual({ title: 'Updated' });
  });

  it('DELETE sets the method', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ message: 'deleted' }));
    await apiDelete('/api/reports/1');
    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(options.method).toBe('DELETE');
  });
});