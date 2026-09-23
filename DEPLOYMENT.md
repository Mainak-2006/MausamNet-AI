# Deployment — Card-Free, ₹0, No Docker, No DNS

Target: **free tiers only, no payment method anywhere**. Runs the full product
(web, API, ML classification, hourly weather sync, hourly Spark batch analytics)
= 0 INR/month. No custom domain required — every service uses its provider's
free default subdomain.

| Piece | Host | Cost |
|---|---|---|
| `apps/web` Next.js | Vercel Hobby (`<web>.vercel.app`) | ₹0 |
| `apps/api` NestJS | Render free web service (`<api>.onrender.com`) | ₹0 (cold starts after ~15 min idle) |
| `services/ml` FastAPI | Render free web service (2nd one, `<ml>.onrender.com`) | ₹0 (same cold-start behaviour) |
| Hourly weather sync + daytime Render keepalive (14-min) | Supabase Scheduled Edge Functions | ₹0 |
| Hourly district/state analytics | GitHub Actions `schedule` (Spark batch) | ₹0 |
| DB / Auth / Realtime / Storage | Supabase free | ₹0 |
| Media | Cloudinary free | ₹0 |

- `KAFKA_ENABLED=false` — weather sync runs in-process inside the API.
- PySpark **batch** (not streaming) via `services/spark/batch.py --from postgres`.
- The ML model artifacts (`services/ml/artifacts/*.joblib`) are committed to the
  repo so Render can run the classifier without a paid host.
- Repo artifacts added for this stack:
  - `.github/workflows/spark-batch.yml` — hourly Spark batch + upload
  - `supabase/functions/sync-weather/` + `supabase/functions/keep-warm/` + `supabase/config.toml` — hourly sync cron + 14-min daytime keepalive
  - `services/spark/batch.py` — gained `--since-hours` and `SPARK_JDBC_JARS` support
  - `apps/api` — ML call/health timeouts now configurable for cold starts

> **Why not Hugging Face Spaces for the ML service?** As of 2026 HF only offers
> free **Static** Spaces; Gradio/Docker Spaces require a paid plan (PRO $9/mo),
> so the FastAPI service runs on a second Render free service instead.

> **No-DNS tradeoff:** URLs are auto-assigned (`<web>.vercel.app`,
> `<api>.onrender.com`, `<ml>.onrender.com`) and Render may hand out a new
> hostname if a service is ever renamed — if that happens, re-sync
> `NEXT_PUBLIC_API_URL`, `CORS_ORIGINS`, and the `API_BASE_URL` edge secret.

---

## 0. Prep (once)

```bash
# From the repo root, with a production .env in place:
pnpm install
pnpm --filter @mausamnet/api run prisma:deploy   # applies apps/api/prisma/migrations
pnpm --filter @mausamnet/api run prisma:seed     # flags ADMIN_EMAIL as ADMIN
```

Make sure the **ADMIN user has a confirmed email + password set** in Supabase
Auth (the edge function logs in as this user). If it was created by magic-link,
set a password first.

## 1. ML service → Render (2nd free service)

1. New **Web Service**, same GitHub repo. Root Directory: **`services/ml`**.
2. Build (auto-detected Python): `pip install -r requirements.txt`.
3. Start: `uvicorn main:app --host 0.0.0.0 --port $PORT`.
4. Env: `NODE_ENV=production`, `ML_API_TOKEN=<shared-with-the-api>`.
   DO NOT set `ML_INSECURE_DEV_MODE=true`.
5. Note the URL: `https://<ml>.onrender.com`.

The model (`services/ml/artifacts/*.joblib`) must be committed to the repo —
Render clones it to serve `/api/classify`. Re-train with `train.py` and commit
the files if you update the model.

## 2. API → Render

1. New **Web Service**, connect the GitHub repo. Root Directory: **repo root**.
2. Build: `npm install -g pnpm && pnpm install --frozen-lockfile && pnpm --filter @mausamnet/api exec prisma generate && pnpm --filter @mausamnet/api run build`
3. Start: `node apps/api/dist/main`
4. **Environment** (production):

```
NODE_ENV=production
SWAGGER_ENABLED=false
CORS_ORIGINS=https://<web>.vercel.app
DATABASE_URL=<pooled :6543, pgbouncer=true>
DIRECT_DATABASE_URL=<direct :5432>
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_JWT_SECRET=...
JWT_SECRET=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
WEATHER_PROVIDERS=openweather,weatherapi
WEATHERAPI_API_KEY=...
OPENWEATHER_API_KEY=...
IMD_API_KEY=...
ML_SERVICE_URL=https://<ml>.onrender.com
ML_API_TOKEN=...
ML_TIMEOUT_MS=60000
ML_HEALTH_TIMEOUT_MS=60000
KAFKA_ENABLED=false
WEBSOCKET_ENABLED=true
WEATHER_SYNC_ENABLED=true
INGESTION_ENABLED=true
```

Note: `POST /api/admin/weather/sync` runs the whole sync **inline in the
request** (`apps/api/src/sync/sync.service.ts`). The edge function stops waiting
after 60 s; the server-side run continues, so let it do its thing.

## 3. Web → Vercel

1. New project from the same repo, Root: `apps/web`, Framework **Next.js**.
2. Environment:
```
NEXT_PUBLIC_API_URL=https://<api>.onrender.com
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_MAP_TILE_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
```
3. No custom domain needed — Vercel serves it at `https://<web>.vercel.app`.
   `NEXT_PUBLIC_API_URL` must match `CORS_ORIGINS` on the API exactly
   (next.config builds `connect-src` from it).

## 4. Supabase scheduled sync (cron)

Local once — from repo root:

```bash
npm i -g supabase
supabase login
supabase link --project-ref <your-ref>   # sets project_id in supabase/config.toml
supabase functions deploy keep-warm --project-ref <your-ref>
supabase functions deploy sync-weather --project-ref <your-ref>
```

Secrets → **Edge Function secrets** (or automatically from the linked project:
`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` are standard, `SUPABASE_ACCESS_TOKEN` is CI-only):

```
API_BASE_URL=https://<api>.onrender.com
ADMIN_EMAIL=<the admin account>
ADMIN_PASSWORD=<admin password>
# Optional: keeps the sleeping Render ML service warm too.
ML_HEALTH_URL=https://<ml>.onrender.com
ML_API_TOKEN=<shared token>
```

Two scheduled functions (`supabase/config.toml`):

- **`keep-warm`** — `*/14 3-12 * * *` (UTC) = **08:30–18:29 IST**, every 14 min.
  Render free spins services down after **15 min idle**, so a sub-15-min ping
  keeps both instances running through the working day. It pings
  `GET /api/health` on the API and (if `ML_HEALTH_URL` is set) on the ML
  service — no auth, no sync, no work for your data.
- **`sync-weather`** — `0 * * * *` (hourly, 24/7). Logs in as the admin, pings
  `/api/health` (liveness) + ML, then POSTs `/api/admin/weather/sync`.
  A `SYNC_IN_PROGRESS` response is treated as success (the API's own fallback
  schedule may also fire — that's fine).

**Why not a longer window / 24/7 keepalive?** Render grants **750 free
instance hours/month shared across the whole workspace** (two services here)
and spun-down instances use 0. Keeping one service up full-time burns ~730
hrs/mo of the budget. The 10 h window ≈ `2 × 10 × 30.4 = 608` hrs plus the
nightly wake-up the 24/7 sync causes (~16 min of every night-hour ≈ 97 hrs)
totals roughly **705 hrs/mo** — just under the cap with headroom. Going to a
full 08:00–20:00 window (over ~830 hrs) would suspend the services mid-month.
To buy back the full window, drop the overnight sync instead.

## 5. GitHub Actions → Spark batch

Add repo secrets (Settings → Secrets and variables → Actions):

```
SPARK_POSTGRES_JDBC_URL=jdbc:postgresql://aws-0-ap-south-1.pooler.supabase.com:5432/postgres?sslmode=require&user=postgres.<ref>&password=<pw>
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

- Use the **direct** `:5432` connection (session mode) for Spark, not the pooled
  `:6543` one — pgBouncer transaction mode breaks JDBC prepared statements.
- Create a storage bucket named **`analytics`** once (Supabase → Storage → New
  bucket; keep it private).
- Run the workflow once manually (`Actions → spark-batch → Run workflow`), then
  it fires every hour. Output: `summaries/by_state.json` + parquet in the bucket.

## 6. Verify

```bash
curl -s https://<api>.onrender.com/api/health
# backend UP, database UP, ml UP, weather UP
```
- Submit a report on the site → ML classification round-trips to the ML Render service.
- Watch `Actions → spark-batch` for a green run; check bucket for `by_state.json`.
- Check `POST /api/admin/weather/sync` status via `supabase/functions` logs.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `/api/health` → `ml: DOWN` | ML Render service cold-starting (wakes in ~30–60 s; health timeout is now 60 s) or `ML_API_TOKEN` mismatch |
| Report saved but `category: null` | ML was cold; the API's keyword fallback ran (see `apps/api/src/ml/ml.service.ts`) — retry after it's warm |
| Spark fails with JDBC/prepared statements | Confirm `SPARK_POSTGRES_JDBC_URL` uses `:5432` (direct, not pooler) |
| Sync 503s / `SYNC_IN_PROGRESS` | Expected when a run is active; it self-completes |
| GitHub cron never fires | Scheduled workflows need activity in last 60 days on private repos; re-trigger manually |
| Render instances sleeping during the day | `keep-warm` wasn't deployed or its secret is missing — deploy it and confirm `cron.job_run_details` in Supabase shows runs every 14 min (`*/14 3-12 * * *` UTC) |
| Instance hours near the 750 cap | Trim the keep-warm window in `supabase/config.toml` (e.g. `3-11`), or drop the overnight sync |
| Vercel CSP blocks API calls | Confirm `NEXT_PUBLIC_API_URL` matches `CORS_ORIGINS` exactly (next.config builds `connect-src` from it) |
| Render hostname changed (service renamed) | Update `NEXT_PUBLIC_API_URL`, `CORS_ORIGINS`, and the `API_BASE_URL` edge secret to the new hostname |