# MausamNet-AI — Agent & Contributor Guidelines

## 1. Project Structure

This is a **Turborepo monorepo** with the following layout:

```
MausamNet-AI/
├── apps/
│   ├── web/          # Next.js 16 frontend (port 3000)
│   ├── api/          # NestJS 11 backend (port 3001)
│   └── ml/           # FastAPI Python ML service (port 8000)
├── packages/
│   ├── shared/       # Shared TypeScript types & constants
│   └── tsconfig/     # Shared TypeScript configs
├── turbo.json        # Turborepo task pipeline
├── pnpm-workspace.yaml
└── package.json      # Root workspace
```

---

## 2. Development Environment

### Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | >= 20.19.0 | Runtime for Next.js + NestJS |
| pnpm | >= 9.0 | Package manager |
| Python | >= 3.12 | Runtime for FastAPI ML service |
| PostgreSQL | >= 16 | Database |
| PostGIS | >= 3.4 | Geospatial extension |

### Quick Start

```bash
# Install root dependencies
pnpm install

# Start all apps in dev mode
pnpm turbo dev --filter="./apps/*"

# Or start individually:
pnpm turbo dev --filter=web      # Next.js on :3000
pnpm turbo dev --filter=api      # NestJS on :3001
cd apps/ml && source .venv/bin/activate && uvicorn app.main:app --port 8000
```

---

## 3. Code Conventions

### 3.1 TypeScript (Frontend + Backend)

```typescript
// File naming: kebab-case for files, PascalCase for components/classes
// Example: weather-map.tsx, WeatherMap.tsx, WeatherMapService

// Imports: group by source (external, internal, types)
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Report } from './report.entity';
import { CreateReportDto } from './dto/create-report.dto';

// Naming:
// - Interfaces: plain name (Report, User, WeatherEvent)
// - Enums: PascalCase (UserRole, WeatherEvent)
// - DTOs: suffix with "Dto" (CreateReportDto, FilterReportsDto)
// - Services: suffix with "Service" (ReportsService, AuthService)
// - Controllers: suffix with "Controller" (ReportsController)
// - Entities: plain name (Report, User, Media)
// - Modules: suffix with "Module" (ReportsModule, AuthModule)
```

### 3.2 NestJS Backend

```typescript
// Module structure: one directory per domain feature
src/
├── reports/
│   ├── reports.module.ts
│   ├── reports.service.ts
│   ├── reports.controller.ts
│   ├── report.entity.ts
│   └── dto/
│       ├── create-report.dto.ts
│       ├── update-report.dto.ts
│       └── filter-reports.dto.ts

// Service pattern: use @InjectRepository for TypeORM
@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
  ) {}

  async create(dto: CreateReportDto, userId: string): Promise<Report> {
    const report = this.reportRepository.create({ ...dto, userId });
    return this.reportRepository.save(report);
  }
}

// Controller pattern: use DTOs for validation
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() dto: CreateReportDto, @Request() req) {
    return this.reportsService.create(dto, req.user.id);
  }
}
```

### 3.3 Next.js Frontend

```typescript
// App Router convention:
// - page.tsx = route page
// - layout.tsx = shared layout
// - loading.tsx = loading UI
// - error.tsx = error boundary

// Component structure:
// - One component per file
// - Named export as default
// - 'use client' directive for interactive components
// - Server components by default (no 'use client')

// File naming: kebab-case
// Component naming: PascalCase

'use client';
import { useState } from 'react';

export default function ReportCard({ report }: { report: Report }) {
  return <div>{report.title}</div>;
}
```

### 3.4 Python (ML Service)

```python
# File naming: snake_case
# Class naming: PascalCase
# Function naming: snake_case
# Constants: UPPER_SNAKE_CASE

# FastAPI router pattern:
router = APIRouter(prefix="/classify", tags=["classify"])

@router.post("/", response_model=ClassificationResponse)
async def classify_weather_event(input: TextInput):
    """Classify a weather report into an event type."""
    ...
```

### 3.5 Git Conventions

```
# Branch naming:
feature/auth-module
feature/map-component
fix/duplicate-detection
docs/requirements-update

# Commit messages (Conventional Commits):
feat: add JWT authentication module
fix: resolve duplicate report detection bug
docs: update API documentation
refactor: extract weather classification service
test: add unit tests for ReportsService
chore: update dependencies
```

---

## 4. Testing Guidelines

### 4.1 NestJS Backend Tests

```bash
# Unit tests
pnpm test --filter=api

# E2E tests
pnpm test:e2e --filter=api

# Test file location: alongside source files
src/reports/
├── reports.service.ts
├── reports.service.spec.ts     # Unit test
├── reports.controller.ts
├── reports.controller.spec.ts  # Unit test
└── reports.e2e-spec.ts         # E2E test
```

### 4.2 Next.js Frontend Tests

```bash
# Unit tests with Jest
pnpm test --filter=web

# Test file location:
components/
├── ReportCard.tsx
└── ReportCard.test.tsx
```

### 4.3 Python ML Service Tests

```bash
# Run tests with pytest
cd apps/ml && pytest

# Test file location:
app/
├── routers/
│   └── classify.py
└── tests/
    └── test_classify.py
```

---

## 5. Environment Variables

**NEVER commit `.env` files.** Always use `.env.example` as template.

| Variable | Where | Description |
|----------|-------|-------------|
| `DB_HOST` | api | PostgreSQL host |
| `DB_PORT` | api | PostgreSQL port |
| `DB_USERNAME` | api | PostgreSQL username |
| `DB_PASSWORD` | api | PostgreSQL password |
| `DB_DATABASE` | api | PostgreSQL database name |
| `JWT_SECRET` | api | JWT signing secret |
| `CLOUDINARY_CLOUD_NAME` | api | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | api | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | api | Cloudinary API secret |
| `OPENWEATHER_API_KEY` | api | OpenWeather API key |
| `IMD_API_KEY` | api | IMD API key |
| `ML_SERVICE_URL` | api | FastAPI ML service URL |
| `NEXT_PUBLIC_API_URL` | web | Backend API URL |
| `NEXT_PUBLIC_MAP_TILE_URL` | web | Map tile URL |

---

## 6. Key Commands Reference

```bash
# Root level
pnpm install                    # Install all dependencies
pnpm turbo dev                  # Start all apps in dev mode
pnpm turbo build                # Build all apps
pnpm turbo lint                 # Lint all apps
pnpm turbo test                 # Test all apps

# Frontend (apps/web)
pnpm turbo dev --filter=web     # Start Next.js dev server
pnpm turbo build --filter=web   # Build Next.js
pnpm turbo lint --filter=web    # Lint frontend

# Backend (apps/api)
pnpm turbo dev --filter=api     # Start NestJS dev server
pnpm turbo build --filter=api   # Build NestJS
pnpm turbo test --filter=api    # Run backend tests

# ML Service (apps/ml)
cd apps/ml
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000  # Start FastAPI
python train.py                             # Train ML model
pytest                                      # Run ML tests

# Database
cd apps/api
npx typeorm-ts-node-commonjs -d src/data-source.ts migration:run     # Run migrations
npx typeorm-ts-node-commonjs -d src/data-source.ts migration:revert  # Revert last migration
npx typeorm-ts-node-commonjs -d src/data-source.ts migration:show    # Show migration status
```

---

## 7. Pull Request Guidelines

1. Create a feature branch from `main`
2. Keep PRs focused on one feature/fix
3. Include tests for new functionality
4. Update documentation if needed
5. Ensure all CI checks pass
6. Request review before merging

### PR Description Template

```markdown
## Description
Brief description of changes.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Refactor
- [ ] Documentation
- [ ] Other

## Testing
- [ ] Unit tests pass
- [ ] E2E tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project conventions
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No console.log or debug code left
```

---

## 8. Common Pitfalls

1. **PostGIS coordinates:** GeoJSON uses `[longitude, latitude]` order, not `[lat, lng]`
2. **TypeORM enums:** Must create PostgreSQL enum types before inserting data
3. **JWT tokens:** Store in localStorage for MVP, migrate to httpOnly cookies later
4. **Cloudinary uploads:** Always use `resource_type: 'auto'` for mixed file types
5. **Leaflet CSS:** Must import `leaflet/dist/leaflet.css` for map to render
6. **Next.js App Router:** Components are Server Components by default, add `'use client'` for interactive ones
7. **TypeORM `autoLoadEntities`:** Use this instead of manually listing entities in `forRoot`
