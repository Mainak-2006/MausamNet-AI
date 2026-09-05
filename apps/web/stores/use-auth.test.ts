import { useAuthStore } from './use-auth';

const jsonResponse = (body: unknown, status = 200): Response =>
  ({
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers({ 'Content-Type': 'application/json' }),
    json: async () => body,
  }) as unknown as Response;

describe('auth store', () => {
  const fetchMock = jest.fn();
  const originalFetch = global.fetch;

  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({
      token: null,
      user: null,
      isLoading: false,
      error: null,
    });
    global.fetch = fetchMock as unknown as typeof fetch;
    fetchMock.mockReset();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it('stores token and user after login', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        accessToken: 'jwt-token',
        user: { id: 'u1', email: 'a@b.c', name: 'Alice', role: 'citizen' },
      }),
    );

    const user = await useAuthStore.getState().login('a@b.c', 'secret1');

    const state = useAuthStore.getState();
    expect(user.email).toBe('a@b.c');
    expect(state.token).toBe('jwt-token');
    expect(state.user?.role).toBe('citizen');
    expect(state.isLoading).toBe(false);
  });

  it('stores token and user after register', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        accessToken: 'reg-token',
        user: { id: 'u2', email: 'b@c.d', name: 'Bob', role: 'admin' },
      }),
    );

    const user = await useAuthStore
      .getState()
      .register({ name: 'Bob', email: 'b@c.d', password: 'secret1' });

    const state = useAuthStore.getState();
    expect(user.role).toBe('admin');
    expect(state.token).toBe('reg-token');
    expect(state.error).toBeNull();
  });

  it('surfaces an error when login fails', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ message: 'Invalid credentials' }, 401));

    await expect(useAuthStore.getState().login('a@b.c', 'wrong')).rejects.toBeDefined();
    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.error).toContain('Invalid credentials');
  });

  it('clears state on logout', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        accessToken: 'jwt-token',
        user: { id: 'u1', email: 'a@b.c', name: 'Alice', role: 'citizen' },
      }),
    );
    await useAuthStore.getState().login('a@b.c', 'secret1');

    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();
  });

  it('fetchProfile refreshes the stored user', async () => {
    useAuthStore.setState({ token: 'jwt-token' });
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ id: 'u1', email: 'a@b.c', name: 'Alice', role: 'citizen' }),
    );

    const user = await useAuthStore.getState().fetchProfile();

    expect(user?.id).toBe('u1');
    expect(useAuthStore.getState().user?.name).toBe('Alice');
  });
});