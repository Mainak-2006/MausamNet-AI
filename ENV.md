# MausamNet-AI — Environment Variables Reference

## Overview

All environment variables are stored in `.env` files. **Never commit `.env` files to version control.**

Use `.env.example` as a template — it contains all required variables with placeholder values.

---

## Required Variables

### Database (PostgreSQL)

| Variable | Example | Description |
|----------|---------|-------------|
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_USERNAME` | `mausamnet` | PostgreSQL username |
| `DB_PASSWORD` | `mausamnet123` | PostgreSQL password |
| `DB_DATABASE` | `mausamnet` | Database name |

**Full connection string:**
```
DB_URL=postgresql://mausamnet:mausamnet123@localhost:5432/mausamnet
```

---

### JWT Authentication

| Variable | Example | Description |
|----------|---------|-------------|
| `JWT_SECRET` | `a1b2c3d4e5f6...` | Secret key for signing JWT tokens |

**Generate a secure secret:**
```bash
openssl rand -hex 32
```

**JWT payload:**
```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "role": "citizen",
  "iat": 1725000000,
  "exp": 1725604800
}
```

**Token expiry:** 7 days (configurable in `auth.module.ts`)

---

### Cloudinary (Media Storage)

| Variable | Example | Description |
|----------|---------|-------------|
| `CLOUDINARY_CLOUD_NAME` | `myweatherapp` | Cloud name from dashboard |
| `CLOUDINARY_API_KEY` | `123456789012345` | API key from dashboard |
| `CLOUDINARY_API_SECRET` | `abcdefg123456789` | API secret from dashboard |

**Get credentials:**
1. Sign up at https://console.cloudinary.com
2. Go to Dashboard → API Keys
3. Copy cloud name, API key, and API secret

---

### Weather APIs

| Variable | Example | Description |
|----------|---------|-------------|
| `OPENWEATHER_API_KEY` | `abc123def456...` | OpenWeatherMap API key |
| `IMD_API_KEY` | `imd_key_123...` | IMD API key (if available) |

**Get OpenWeather key:**
1. Sign up at https://openweathermap.org/api
2. Go to My API Keys
3. Copy your API key (free tier: 1000 calls/day)

---

### ML Service

| Variable | Example | Description |
|----------|---------|-------------|
| `ML_SERVICE_URL` | `http://localhost:8000` | FastAPI ML service URL |

**Used by:** NestJS backend to call classification, credibility, and duplicate endpoints.

---

## Frontend Variables

| Variable | Example | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001` | Backend API base URL |
| `NEXT_PUBLIC_MAP_TILE_URL` | `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png` | Map tile URL |

**Note:** Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser. Never put secrets in these.

---

## Complete .env.example

```env
# ===========================================
# MausamNet-AI Environment Configuration
# ===========================================

# ---- Database (PostgreSQL) ----
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=mausamnet
DB_PASSWORD=mausamnet123
DB_DATABASE=mausamnet

# ---- JWT Authentication ----
JWT_SECRET=change-me-to-a-random-string

# ---- Cloudinary (Media Storage) ----
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# ---- Weather APIs ----
OPENWEATHER_API_KEY=your_openweathermap_api_key
IMD_API_KEY=your_imd_api_key

# ---- ML Service ----
ML_SERVICE_URL=http://localhost:8000

# ---- Frontend ----
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_MAP_TILE_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
```

---

## Variable Usage by Service

| Variable | Next.js | NestJS | FastAPI |
|----------|---------|--------|---------|
| `DB_HOST` | — | ✓ | — |
| `DB_PORT` | — | ✓ | — |
| `DB_USERNAME` | — | ✓ | — |
| `DB_PASSWORD` | — | ✓ | — |
| `DB_DATABASE` | — | ✓ | — |
| `JWT_SECRET` | — | ✓ | — |
| `CLOUDINARY_CLOUD_NAME` | — | ✓ | — |
| `CLOUDINARY_API_KEY` | — | ✓ | — |
| `CLOUDINARY_API_SECRET` | — | ✓ | — |
| `OPENWEATHER_API_KEY` | — | ✓ | — |
| `IMD_API_KEY` | — | ✓ | — |
| `ML_SERVICE_URL` | — | ✓ | — |
| `NEXT_PUBLIC_API_URL` | ✓ | — | — |
| `NEXT_PUBLIC_MAP_TILE_URL` | ✓ | — | — |

---

## Security Notes

1. **Never commit `.env` files** — They're in `.gitignore`
2. **Use `.env.example` as template** — It has placeholder values
3. **Generate strong JWT_SECRET** — Use `openssl rand -hex 32`
4. **Rotate API keys regularly** — Especially Cloudinary and OpenWeather
5. **Don't log secrets** — Never `console.log(process.env.JWT_SECRET)`
6. **Use different values per environment** — dev, staging, production
7. **Restrict Cloudinary access** — Use upload presets with restrictions

---

## Environment-Specific Config

### Development (.env.development)
```env
DB_HOST=localhost
DB_PORT=5432
# ... other dev values
```

### Production (.env.production)
```env
DB_HOST=your-production-db-host
DB_PORT=5432
# ... use strong passwords, real API keys
```

### Testing (.env.test)
```env
DB_HOST=localhost
DB_DATABASE=mausamnet_test
# ... test-specific values
```
