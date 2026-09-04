# MausamNet-AI — Deployment Checklist

## Pre-Deployment

### 1. Code Quality

- [ ] All tests passing (`pnpm test`)
- [ ] No lint errors (`pnpm lint`)
- [ ] No TypeScript errors (`pnpm build`)
- [ ] No `console.log` statements left in code
- [ ] No hardcoded secrets or API keys
- [ ] All environment variables documented in `.env.example`

### 2. Security

- [ ] JWT_SECRET is strong and unique
- [ ] Database password is strong
- [ ] Cloudinary credentials are valid
- [ ] CORS configured for production domain
- [ ] Rate limiting configured (future)
- [ ] No sensitive data in Git history

### 3. Database

- [ ] All migrations run successfully
- [ ] Database backup created
- [ ] PostGIS extension enabled
- [ ] UUID extension enabled
- [ ] Indexes created for performance
- [ ] Seed data loaded (if needed)

### 4. ML Service

- [ ] Model trained and saved (`classifier.joblib`)
- [ ] FastAPI endpoints tested
- [ ] Model accuracy acceptable (>80%)
- [ ] All dependencies in `requirements.txt`

---

## Deployment Options

### Option 1: Local Development

```bash
# Start all services
pnpm turbo dev --filter=web      # :3000
pnpm turbo dev --filter=api      # :3001
cd apps/ml && uvicorn app.main:app --port 8000  # :8000
```

**Pros:** Simple, fast iteration
**Cons:** Not accessible from internet, single user

---

### Option 2: Docker (Future)

```yaml
# docker-compose.yml (future implementation)
version: '3.8'

services:
  postgres:
    image: postgis/postgis:16-3.4
    environment:
      POSTGRES_DB: mausamnet
      POSTGRES_USER: mausamnet
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  api:
    build: ./apps/api
    ports:
      - "3001:3001"
    environment:
      DB_HOST: postgres
      DB_PORT: 5432
      DB_USERNAME: mausamnet
      DB_PASSWORD: ${DB_PASSWORD}
      DB_DATABASE: mausamnet
      JWT_SECRET: ${JWT_SECRET}
    depends_on:
      - postgres

  web:
    build: ./apps/web
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://api:3001

  ml:
    build: ./apps/ml
    ports:
      - "8000:8000"

volumes:
  pgdata:
```

---

### Option 3: Cloud Deployment (Production)

#### Recommended Architecture

```
┌─────────────────────────────────────────────┐
│              Cloud Provider                  │
│  (AWS / GCP / Azure / DigitalOcean)         │
│                                             │
│  ┌─────────────┐  ┌─────────────┐          │
│  │   VPS / EC2  │  │  Managed DB │          │
│  │   (App)      │  │  (Postgres) │          │
│  └──────┬──────┘  └──────┬──────┘          │
│         │                 │                  │
│         └────────┬────────┘                  │
│                  │                           │
│         ┌────────┴────────┐                  │
│         │   Load Balancer │                  │
│         └─────────────────┘                  │
│                                             │
│  ┌─────────────┐  ┌─────────────┐          │
│  │   Cloudinary │  │   Domain    │          │
│  │   (Media)    │  │   (DNS)     │          │
│  └─────────────┘  └─────────────┘          │
└─────────────────────────────────────────────┘
```

---

## Step-by-Step Deployment

### Step 1: Prepare Production Build

```bash
# Build all apps
pnpm turbo build

# Verify builds
ls -la apps/web/.next/
ls -la apps/api/dist/
```

### Step 2: Setup Production Server

```bash
# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pnpm
corepack enable
corepack prepare pnpm@latest --activate

# Install Python 3.12
sudo apt install python3.12 python3.12-venv

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib
sudo apt install postgresql-16-postgis-3
```

### Step 3: Setup Database

```bash
# Create database
sudo -u postgres psql -c "CREATE USER mausamnet WITH PASSWORD 'STRONG_PASSWORD_HERE';"
sudo -u postgres psql -c "CREATE DATABASE mausamnet OWNER mausamnet;"
sudo -u postgres psql -d mausamnet -c "CREATE EXTENSION IF NOT EXISTS postgis;"
sudo -u postgres psql -d mausamnet -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"

# Run migrations
cd apps/api
npx typeorm-ts-node-commonjs -d src/data-source.ts migration:run
```

### Step 4: Configure Environment

```bash
# Create production .env
nano /opt/mausamnet/.env

# Set strong values for:
# - JWT_SECRET (generate with: openssl rand -hex 32)
# - DB_PASSWORD (strong random password)
# - All API keys (real production keys)
```

### Step 5: Setup Process Manager (PM2)

```bash
# Install PM2
npm install -g pm2

# Start NestJS backend
cd apps/api
pm2 start dist/main.js --name "mausamnet-api"

# Start Next.js frontend
cd apps/web
pm2 start node_modules/.bin/next --name "mausamnet-web" -- start -p 3000

# Start FastAPI ML service
cd apps/ml
pm2 start "uvicorn app.main:app --host 0.0.0.0 --port 8000" --name "mausamnet-ml"

# Save PM2 configuration
pm2 save

# Setup auto-start on reboot
pm2 startup
```

### Step 6: Configure Nginx (Reverse Proxy)

```nginx
# /etc/nginx/sites-available/mausamnet

server {
    listen 80;
    server_name mausamnet.com www.mausamnet.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # ML Service
    location /ml/ {
        proxy_pass http://localhost:8000/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    # SSL (use Certbot)
    # listen 443 ssl;
    # ssl_certificate /etc/letsencrypt/live/mausamnet.com/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/mausamnet.com/privkey.pem;
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/mausamnet /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Step 7: SSL Certificate

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d mausamnet.com -d www.mausamnet.com

# Auto-renewal
sudo certbot renew --dry-run
```

### Step 8: Verify Deployment

```bash
# Check all services
pm2 status

# Check logs
pm2 logs mausamnet-api
pm2 logs mausamnet-web
pm2 logs mausamnet-ml

# Test endpoints
curl https://mausamnet.com/api/health
curl https://mausamnet.com/ml/health

# Test frontend
open https://mausamnet.com
```

---

## Post-Deployment

### Monitoring

```bash
# Check PM2 status
pm2 status

# Check system resources
htop
df -h
free -m

# Check PostgreSQL
sudo systemctl status postgresql

# Check Nginx
sudo systemctl status nginx
```

### Backup Strategy

```bash
# Database backup (daily cron)
pg_dump -U mausamnet -h localhost mausamnet | gzip > /backup/mausamnet_$(date +%Y%m%d).sql.gz

# Restore from backup
gunzip -c /backup/mausamnet_20260901.sql.gz | psql -U mausamnet -h localhost mausamnet
```

### Log Management

```bash
# PM2 logs location
~/.pm2/logs/

# Nginx logs
/var/log/nginx/access.log
/var/log/nginx/error.log

# Rotate logs
pm2 install pm2-logrotate
pm2-logrotate setup
```

---

## Rollback Plan

If something goes wrong:

```bash
# 1. Stop services
pm2 stop all

# 2. Restore database from backup
gunzip -c /backup/mausamnet_YYYYMMDD.sql.gz | psql -U mausamnet mausamnet

# 3. Revert to previous code
cd /opt/mausamnet
git checkout <previous-commit>

# 4. Rebuild
pnpm turbo build

# 5. Restart
pm2 start all
```

---

## Performance Tuning

### PostgreSQL

```sql
-- Increase shared buffers (in postgresql.conf)
shared_buffers = 256MB
work_mem = 4MB
maintenance_work_mem = 64MB

-- Enable connection pooling (PgBouncer)
```

### Node.js

```bash
# Increase memory limit
NODE_OPTIONS="--max-old-space-size=4096"

# Use cluster mode
pm2 start dist/main.js -i max --name "mausamnet-api"
```

### Nginx

```nginx
# Enable gzip
gzip on;
gzip_types text/plain application/json application/javascript text/css;

# Enable caching
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

---

## Environment Variables Checklist

| Variable | Dev | Production |
|----------|-----|------------|
| `DB_HOST` | localhost | production-db-host |
| `DB_PORT` | 5432 | 5432 |
| `DB_USERNAME` | mausamnet | mausamnet |
| `DB_PASSWORD` | mausamnet123 | STRONG_PASSWORD |
| `DB_DATABASE` | mausamnet | mausamnet |
| `JWT_SECRET` | dev-secret | STRONG_RANDOM_SECRET |
| `CLOUDINARY_*` | dev keys | production keys |
| `OPENWEATHER_API_KEY` | dev key | production key |
| `ML_SERVICE_URL` | http://localhost:8000 | http://localhost:8000 |

---

## Troubleshooting

### Service won't start
```bash
# Check logs
pm2 logs mausamnet-api

# Check port availability
sudo lsof -i :3001

# Restart service
pm2 restart mausamnet-api
```

### Database connection failed
```bash
# Check PostgreSQL
sudo systemctl status postgresql

# Test connection
psql -U mausamnet -h localhost mausamnet

# Check pg_hba.conf for authentication
sudo nano /etc/postgresql/16/main/pg_hba.conf
```

### ML service errors
```bash
# Check Python environment
source apps/ml/.venv/bin/activate
python -c "import sklearn; print(sklearn.__version__)"

# Retrain model
cd apps/ml
python train.py

# Check model file
ls -la models/classifier.joblib
```
