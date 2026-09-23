// MausamNet-AI Render keepalive.
//
// Runs every 14 minutes inside a waking window (see supabase/config.toml:
//   schedule = "*/14 3-12 * * *"  →  08:30–18:29 IST / 03:00–12:59 UTC).
// Render free services spin down after 15 min without inbound traffic, so a
// ping every <15 min keeps both Render instances warm without paying.
// Budget: 1 service warm for W h/day uses ~30.4×W hrs/month of the 750 shared
// free instance hours — this 10 h window + the 24/7 hourly sync ≈ 705 hrs/mo.
//
// Required secrets: API_BASE_URL (e.g. https://mausamnet-ai-api.onrender.com)
// Optional: ML_HEALTH_URL (e.g. https://mausamnet-ai.onrender.com), ML_API_TOKEN

// Cold start on a spun-down Render service can take ~60s, so allow a generous
// timeout per fetch. Failures are caught and reported, never thrown.
const REQUEST_TIMEOUT_MS = 90_000;

Deno.serve(async () => {
  const API_BASE_URL = (Deno.env.get("API_BASE_URL") ?? "").replace(/\/+$/, "");
  const ML_HEALTH_URL = (Deno.env.get("ML_HEALTH_URL") ?? "").replace(/\/+$/, "");
  const ML_API_TOKEN = Deno.env.get("ML_API_TOKEN") ?? "";

  if (!API_BASE_URL) {
    return json({ error: "Missing secret: API_BASE_URL" }, 500);
  }

  const [api, ml] = await Promise.all([
    ping(`${API_BASE_URL}/api/health`),
    ML_HEALTH_URL
      ? ping(`${ML_HEALTH_URL}/api/health`, ML_API_TOKEN ? { Authorization: `Bearer ${ML_API_TOKEN}` } : {})
      : Promise.resolve(null),
  ]);

  return json({ api, ml });
});

async function ping(url: string, headers: Record<string, string> = {}): Promise<Record<string, unknown>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, { headers, signal: controller.signal });
    const body = res.ok ? await res.json().catch(() => null) : null;
    return { url, status: res.status, ok: res.ok, body };
  } catch (err) {
    return { url, ok: false, error: String(err) };
  } finally {
    clearTimeout(timer);
  }
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}