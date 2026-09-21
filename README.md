# MausamNet-AI

AI-powered National Weather Big Data Analytics Platform.

Collects verified weather intelligence from official APIs, citizen reports and internet sources;
classifies events with an ML model, assigns credibility scores, detects duplicates, and visualizes
trusted data on dashboards, maps, analytics and alerts.

## Architecture

```
apps/web        Next.js 14 frontend (public + user dashboard + admin)
apps/api        NestJS backend (REST API, Prisma, Supabase Auth)
services/ml     Python FastAPI + scikit-learn classification service
services/spark  PySpark streaming + batch analytics (Kafka -> district/state summaries)
DB              Supabase PostgreSQL (via Prisma ORM)
Media           Cloudinary
Kafka           optional message broker for the weather sync pipeline
```

## Prerequisites

- Node.js >= 20 (pnpm)
- Python >= 3.11
- A Supabase project with the DB credentials and Auth enabled

## Setup

```bash
pnpm install

# 1. Wire up env vars (see .env.example). The project ref lives in the DB host.
# A single root .env is shared by the API, web, ML service and Prisma CLI.
cp .env.example .env
# edit .env -> DB_USERNAME, DB_PASSWORD, DATABASE_URL, DIRECT_DATABASE_URL,
#   SUPABASE_URL, SUPABASE_ANON_KEY, CLOUDINARY_*, *_API_KEY

# 2. Push the Prisma schema to the database
pnpm prisma:generate
pnpm prisma:migrate
pnpm prisma:seed   # creates/ flags an ADMIN (uses ADMIN_EMAIL)

# 3. ML service
cd services/ml
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python train.py          # trains a real scikit-learn model (optional)
uvicorn main:app --reload --port 8000

# 4. Weather sync + streaming (optional)
# The API auto-syncs weather for 763 districts + 306 major cities every
# WEATHER_SYNC_INTERVAL_MINUTES (default 60m), with a manual trigger at:
#   POST /api/admin/weather/sync
# Without Kafka it runs in-process. Enable Kafka to move jobs/snapshots
# through the broker and feed the PySpark service:
docker compose up -d kafka        # optional; then set KAFKA_ENABLED=true
cd services/spark
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python main.py                    # streaming analytics from Kafka
python batch.py --from parquet    # batch district/state summaries

# 5. Run everything
pnpm dev        # web on :3000, api on :3002, (ml on :8000 separately)
```

## Services

| App         | Port | Notes                                    |
| ----------- | ---- | ---------------------------------------- |
| web         | 3000 | Next.js app router                       |
| api         | 3002 | NestJS REST API                          |
| ml          | 8000 | FastAPI classification service           |
| spark       |  -   | PySpark streaming/batch analytics        |
| kafka       | 9092 | optional broker (UI at :8080)            |

## Auth

Authentication is delegated to Supabase Auth. The frontend uses `@supabase/supabase-js`;
the NestJS backend verifies Supabase JWTs using the `SUPABASE_JWT_SECRET`. A `Profile` row is
auto-created/upserted in our `profiles` table the first time a verified JWT hits an API route.
Role-based access uses the `role` column (`USER`, `ADMIN`, `SUPER_ADMIN`).

## Key API routes

- `POST /api/auth/verify` – validate a Supabase JWT / sync the profile
- `GET  /api/reports` – public report feed with filters & pagination
- `POST /api/reports` – submit a citizen report (runs AI classification + duplicate + credibility)
- `GET  /api/reports/:id` – report detail
- `GET  /api/weather/current` / `/api/weather/city/:city` – live weather from OpenWeather/WeatherAPI
- `POST /api/admin/weather/sync` – trigger a weather sync (admin) `{ "scope": "all|districts|cities" }`
- `GET  /api/admin/weather/sync` – sync status: kafka, schedule, providers, locations, runs
- `GET  /api/admin/weather/sync/runs` – recent sync runs
- `GET  /api/analytics/overview` – dashboard stats
- `GET  /api/health` – system health (db, ml, weather)
- `POST /api/media/upload` – Cloudinary upload (auth)

## Repo layout

```
apps/api/prisma/schema.prisma   data model
apps/api/src/modules             NestJS feature modules
apps/web/app                    Next.js app-router pages
services/ml/main.py             ML API
services/ml/train.py            model training script
```

See `FEATURES.md` for the full product spec and MVP objective.