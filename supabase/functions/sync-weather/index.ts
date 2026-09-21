// MausamNet-AI hourly weather-sync trigger + Render keepalive.
//
// Deployed as a Supabase scheduled function (see supabase/config.toml):
// it logs in as the ADMIN user, pings the API health endpoint (keeps the
// free Render instance warm) and POSTs /api/admin/weather/sync.
//
// Required secrets:
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_EMAIL, ADMIN_PASSWORD,
//   API_BASE_URL (e.g. https://api.mausamnet.duckdns.org)
// Optional (keeps a sleeping Render ML service warm each hour):
//   ML_HEALTH_URL (e.g. https://mausamnet-ml.onrender.com), ML_API_TOKEN

import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL") ?? "";
const ADMIN_PASSWORD = Deno.env.get("ADMIN_PASSWORD") ?? "";
const API_BASE_URL = (Deno.env.get("API_BASE_URL") ?? "").replace(/\/+$/, "");
const ML_HEALTH_URL = (Deno.env.get("ML_HEALTH_URL") ?? "").replace(/\/+$/, "");
const ML_API_TOKEN = Deno.env.get("ML_API_TOKEN") ?? "";

// Give the weather-sync request up to 60s. The API runs the whole
// 1000+ location sync inline in the request, so a timeout here does not stop
// the server-side run — it just means we stop waiting for a response.
const SYNC_WAIT_MS = 60_000;

Deno.serve(async (_req) => {
  const missing = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "ADMIN_EMAIL", "ADMIN_PASSWORD", "API_BASE_URL"]
    .filter((key) => !Deno.env.get(key));
  if (missing.length > 0) {
    return json({ error: `Missing secrets: ${missing.join(", ")}` }, 500);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data, error } = await supabase.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });
  if (error || !data.session) {
    return json({ error: "Admin login failed", detail: error?.message }, 401);
  }
  const token = data.session.access_token;

  // Liveness + keepalive (public endpoint, wakes the Render instance).
  let health: unknown = null;
  try {
    const res = await fetch(`${API_BASE_URL}/api/health`);
    health = res.ok ? await res.json() : { status: res.status };
  } catch (err) {
    health = { error: String(err) };
  }

  // Keep a sleeping Render ML service warm too (optional).
  let mlHealth: unknown = null;
  if (ML_HEALTH_URL) {
    try {
      const res = await fetch(`${ML_HEALTH_URL}/api/health`, {
        headers: ML_API_TOKEN
          ? { Authorization: `Bearer ${ML_API_TOKEN}` }
          : {},
      });
      mlHealth = res.ok ? await res.json() : { status: res.status };
    } catch (err) {
      mlHealth = { error: String(err) };
    }
  }

  // Trigger an hourly full weather sync.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SYNC_WAIT_MS);
  let sync: Record<string, unknown>;
  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/weather/sync`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ scope: "all" }),
      signal: controller.signal,
    });
    const body = await res.text();
    sync = { status: res.status, ok: res.ok, body };
    if ((body ?? "").includes("SYNC_IN_PROGRESS")) {
      sync.ok = true; // already running — not an error
    }
  } catch (err) {
    sync = {
      status: "dispatched",
      ok: true,
      body: `request timed out after ${SYNC_WAIT_MS}ms; server-side run continues (${String(err)})`,
    };
  } finally {
    clearTimeout(timer);
  }

  return json({ health, mlHealth, sync });
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}