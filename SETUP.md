# MausamNet-AI — Development Setup Guide

## Prerequisites

Install the following tools before starting:

| Tool | Version | Install Command |
|------|---------|-----------------|
| Node.js | >= 20.19.0 | `nvm install 20` |
| pnpm | >= 9.0 | `corepack enable && corepack prepare pnpm@latest --activate` |
| Python | >= 3.12 | `sudo apt install python3.12 python3.12-venv` |
| PostgreSQL | >= 16 | `sudo apt install postgresql postgresql-contrib` |
| PostGIS | >= 3.4 | `sudo apt install postgresql-16-postgis-3` |
| Git | latest | `sudo apt install git` |

---

## Step 1: Clone & Install

```bash
# Clone the repository
git clone <repository-url>
cd MausamNet-AI

# Install root dependencies
pnpm install

# Install frontend dependencies
cd apps/web && pnpm install && cd ../..

# Install backend dependencies
cd apps/api && pnpm install && cd ../..

# Setup Python virtual environment
cd apps/ml
python3 -12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cd ../..
```

---

## Step 2: PostgreSQL Setup

```bash
# Start PostgreSQL service
sudo systemctl start postgresql

# Create database user
sudo -u postgres psql -c "CREATE USER mausamnet WITH PASSWORD 'mausamnet123';"

# Create database
sudo -u postgres psql -c "CREATE DATABASE mausamnet OWNER mausamnet;"

# Enable PostGIS extension
sudo -u postgres psql -d mausamnet -c "CREATE EXTENSION IF NOT EXISTS postgis;"
sudo -u postgres psql -d mausamnet -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"

# Grant privileges
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE mausamnet TO mausamnet;"
sudo -u postgres psql -d mausamnet -c "GRANT ALL ON SCHEMA public TO mausamnet;"
```

---

## Step 3: Environment Variables

```bash
# Copy the example env file
cp .env.example .env

# Edit .env with your values
nano .env
```

**Required values:**
- `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE` — PostgreSQL connection
- `JWT_SECRET` — Any random string (generate with `openssl rand -hex 32`)
- `CLOUDINARY_*` — Get from [Cloudinary Dashboard](https://console.cloudinary.com)
- `OPENWEATHER_API_KEY` — Get from [OpenWeather](https://openweathermap.org/api)
- `ML_SERVICE_URL` — Default: `http://localhost:8000`

---

## Step 4: Database Migration

```bash
cd apps/api

# Run all migrations
npx typeorm-ts-node-commonjs -d src/data-source.ts migration:run

# Verify tables created
npx typeorm-ts-node-commonjs -d src/data-source.ts migration:show
```

---

## Step 5: Train ML Model

```bash
cd apps/ml
source .venv/bin/activate

# Train the weather classification model
python train.py

# Verify model created
ls -la models/classifier.joblib
```

---

## Step 6: Start Services

Open **3 terminal windows** and run each service:

### Terminal 1: Next.js Frontend
```bash
cd apps/web
pnpm dev
# Runs on http://localhost:3000
```

### Terminal 2: NestJS Backend
```bash
cd apps/api
pnpm run start:dev
# Runs on http://localhost:3001
```

### Terminal 3: FastAPI ML Service
```bash
cd apps/ml
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
# Runs on http://localhost:8000
```

---

## Step 7: Verify Everything Works

```bash
# Test backend health
curl http://localhost:3001

# Test ML service health
curl http://localhost:8000/health

# Test frontend
open http://localhost:3000

# Test ML classification
curl -X POST http://localhost:8000/classify \
  -H "Content-Type: application/json" \
  -d '{"text": "Heavy rain in Delhi"}'
```

---

## Step 8: Seed Data (Optional)

```bash
cd apps/api

# Run seed script
npx ts-node -r tsconfig-paths/register src/scripts/seed-admin.ts
npx ts-node -r tsconfig-paths/register src/scripts/seed-reports.ts
```

---

## Quick Start (All Commands)

```bash
# 1. Install everything
pnpm install

# 2. Setup database
sudo systemctl start postgresql
sudo -u postgres psql -c "CREATE USER mausamnet WITH PASSWORD 'mausamnet123';"
sudo -u postgres psql -c "CREATE DATABASE mausamnet OWNER mausamnet;"
sudo -u postgres psql -d mausamnet -c "CREATE EXTENSION IF NOT EXISTS postgis;"
sudo -u postgres psql -d mausamnet -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"

# 3. Setup environment
cp .env.example .env
# Edit .env with your values

# 4. Run migrations
cd apps/api && npx typeorm-ts-node-commonjs -d src/data-source.ts migration:run && cd ../..

# 5. Train ML model
cd apps/ml && source .venv/bin/activate && python train.py && cd ../..

# 6. Start all services (in separate terminals)
pnpm turbo dev --filter=@mausamnet/web     # Terminal 1
pnpm turbo dev --filter=@mausamnet/api     # Terminal 2
cd apps/ml && uvicorn app.main:app --reload --port 8000  # Terminal 3
```

---

## IDE Setup

### VS Code Extensions

Install these extensions for the best development experience:

| Extension | Purpose |
|-----------|---------|
| ESLint | Code linting |
| Prettier | Code formatting |
| Tailwind CSS IntelliSense | Tailwind autocomplete |
| TypeScript Importer | Auto-import TypeScript |
| Thunder Client | API testing (like Postman) |
| Python | Python language support |
| Prisma (if used later) | Schema highlighting |

### VS Code Settings

Add to `.vscode/settings.json`:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

---

## Common Issues & Solutions

### Issue: "Cannot find module" errors in NestJS
```bash
# Rebuild TypeScript
cd apps/api
pnpm run build
```

### Issue: PostgreSQL connection refused
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check port
sudo netstat -tlnp | grep 5432
```

### Issue: PostGIS extension not found
```bash
# Ensure PostGIS is installed
sudo apt install postgresql-16-postgis-3

# Then create extension
sudo -u postgres psql -d mausamnet -c "CREATE EXTENSION IF NOT EXISTS postgis;"
```

### Issue: Leaflet map not rendering
```css
/* Ensure Leaflet CSS is imported in your component */
@import 'leaflet/dist/leaflet.css';
```

### Issue: ML model not found
```bash
# Retrain the model
cd apps/ml
source .venv/bin/activate
python train.py
```

### Issue: Cloudinary upload fails
- Check `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` in `.env`
- Verify credentials at https://console.cloudinary.com

---

## Development Workflow

1. **Start with:** Backend API (NestJS) on port 3001
2. **Then:** ML service (FastAPI) on port 8000
3. **Finally:** Frontend (Next.js) on port 3000
4. **Test APIs** using Thunder Client or curl
5. **Test frontend** in browser

### Recommended Order:
1. Create feature branch
2. Implement backend endpoint
3. Test with curl/Thunder Client
4. Implement frontend page
5. Test end-to-end
6. Write tests
7. Create PR
