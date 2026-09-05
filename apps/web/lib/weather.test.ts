import { fetchCurrentWeather, fetchWeather } from './weather';

const jsonResponse = (body: unknown, status = 200): Response =>
  ({
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers({ 'Content-Type': 'application/json' }),
    json: async () => body,
  }) as unknown as Response;

describe('weather client', () => {
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

  it('fetches the forecast endpoint for a city', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ provider: 'multi' }));
    await fetchWeather({ city: 'Mumbai' });
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain('/api/weather/forecast');
    expect(url).toContain('city=Mumbai');
  });

  it('passes latitude and longitude to the current endpoint', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ provider: 'weatherapi' }));
    await fetchCurrentWeather({ lat: 19.07, lng: 72.88 });
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain('/api/weather/current');
    expect(url).toContain('lat=19.07');
    expect(url).toContain('lng=72.88');
  });

  it('drops undefined query fields', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ provider: 'weatherapi' }));
    await fetchWeather({ city: 'Delhi' });
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).not.toContain('lat=');
    expect(url).not.toContain('lng=');
  });

  it('returns the parsed weather response', async () => {
    const payload = {
      provider: 'multi',
      location: { name: 'Mumbai', country: 'India', latitude: 19.07, longitude: 72.88 },
      current: {
        temperature: 28,
        feelsLike: 30,
        humidity: 75,
        windSpeed: 12.6,
        precipitation: 0.5,
        weatherCode: 1003,
        condition: 'Partly cloudy',
        recordedAt: '2026-09-05T12:00:00Z',
      },
      forecast: [],
      sources: [],
    };
    fetchMock.mockResolvedValueOnce(jsonResponse(payload));
    const result = await fetchWeather({ city: 'Mumbai' });
    expect(result).toEqual(payload);
  });
});