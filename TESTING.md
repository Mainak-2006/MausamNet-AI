# MausamNet-AI — Testing Guidelines

## Overview

Testing is organized into three levels:

1. **Unit Tests** — Test individual functions and classes
2. **Integration Tests** — Test module interactions and API endpoints
3. **E2E Tests** — Test complete user workflows

---

## Testing Stack

| Service | Framework | Command |
|---------|-----------|---------|
| NestJS Backend | Jest + Supertest | `pnpm test --filter=api` |
| Next.js Frontend | Jest + React Testing Library | `pnpm test --filter=web` |
| FastAPI ML Service | pytest | `cd apps/ml && pytest` |

---

## 1. NestJS Backend Tests

### Unit Tests

**Location:** Alongside source files (`*.spec.ts`)

**Example — Reports Service:**
```typescript
// src/reports/reports.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { Report } from './report.entity';

describe('ReportsService', () => {
  let service: ReportsService;
  let mockRepository: any;

  beforeEach(async () => {
    mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        {
          provide: getRepositoryToken(Report),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new report', async () => {
      const dto = {
        title: 'Heavy rain',
        description: 'Streets flooded',
        eventType: 'rainfall',
        latitude: 28.6139,
        longitude: 77.2090,
        city: 'Delhi',
        state: 'Delhi',
        reportDate: new Date(),
      };
      const userId = 'user-uuid';

      mockRepository.create.mockReturnValue({ id: 'report-uuid', ...dto, userId });
      mockRepository.save.mockResolvedValue({ id: 'report-uuid', ...dto, userId });

      const result = await service.create(dto, userId);

      expect(result).toEqual({ id: 'report-uuid', ...dto, userId });
      expect(mockRepository.create).toHaveBeenCalledWith({ ...dto, userId });
      expect(mockRepository.save).toHaveBeenCalled();
    });
  });
});
```

**Run unit tests:**
```bash
cd apps/api
pnpm test
```

---

### Integration Tests

**Location:** Same directory as unit tests (`*.spec.ts`)

**Example — Reports Controller:**
```typescript
// src/reports/reports.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';

describe('ReportsController (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Get auth token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });
    authToken = loginResponse.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/reports (POST)', () => {
    it('should create a report', () => {
      return request(app.getHttpServer())
        .post('/reports')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Report',
          description: 'Test description',
          eventType: 'rainfall',
          latitude: 28.6139,
          longitude: 77.2090,
          city: 'Delhi',
          state: 'Delhi',
          reportDate: new Date().toISOString(),
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.id).toBeDefined();
          expect(res.body.title).toBe('Test Report');
        });
    });

    it('should return 401 without auth token', () => {
      return request(app.getHttpServer())
        .post('/reports')
        .send({
          title: 'Test Report',
          description: 'Test description',
          eventType: 'rainfall',
          latitude: 28.6139,
          longitude: 77.2090,
          city: 'Delhi',
          state: 'Delhi',
          reportDate: new Date().toISOString(),
        })
        .expect(401);
    });
  });

  describe('/reports (GET)', () => {
    it('should return paginated reports', () => {
      return request(app.getHttpServer())
        .get('/reports?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toBeInstanceOf(Array);
          expect(res.body.total).toBeDefined();
          expect(res.body.page).toBe(1);
        });
    });
  });
});
```

---

### Test File Naming

| Pattern | Description |
|---------|-------------|
| `*.spec.ts` | Unit test |
| `*.e2e-spec.ts` | End-to-end test |
| `*.integration-spec.ts` | Integration test |

---

### Running Tests

```bash
# All tests
pnpm test --filter=api

# Specific test file
cd apps/api
pnpm test -- --testPathPattern=reports.service.spec.ts

# Watch mode
pnpm test -- --watch

# Coverage
pnpm test -- --coverage

# E2E tests
pnpm test:e2e --filter=api
```

---

## 2. Next.js Frontend Tests

### Unit Tests

**Location:** Alongside component files (`*.test.tsx`)

**Example — ReportCard:**
```typescript
// components/reports/ReportCard.test.tsx
import { render, screen } from '@testing-library/react';
import ReportCard from './ReportCard';

const mockReport = {
  id: 'report-uuid',
  title: 'Heavy Rainfall in Delhi',
  eventType: 'rainfall',
  verificationStatus: 'verified',
  credibilityScore: 85.0,
  city: 'Delhi',
  state: 'Delhi',
  createdAt: '2026-09-01T14:30:00.000Z',
};

describe('ReportCard', () => {
  it('renders report title', () => {
    render(<ReportCard report={mockReport} />);
    expect(screen.getByText('Heavy Rainfall in Delhi')).toBeInTheDocument();
  });

  it('displays event type badge', () => {
    render(<ReportCard report={mockReport} />);
    expect(screen.getByText('rainfall')).toBeInTheDocument();
  });

  it('shows credibility score', () => {
    render(<ReportCard report={mockReport} />);
    expect(screen.getByText('85.0')).toBeInTheDocument();
  });

  it('displays verification status', () => {
    render(<ReportCard report={mockReport} />);
    expect(screen.getByText('verified')).toBeInTheDocument();
  });
});
```

---

### Running Frontend Tests

```bash
# All tests
pnpm test --filter=web

# Specific test
cd apps/web
pnpm test -- --testPathPattern=ReportCard.test.tsx

# Watch mode
pnpm test -- --watch

# Coverage
pnpm test -- --coverage
```

---

## 3. FastAPI ML Service Tests

### Unit Tests

**Location:** `apps/ml/app/tests/`

**Example — Classifier:**
```python
# apps/ml/app/tests/test_classifier.py
import pytest
from app.services.classifier import WeatherClassifier

@pytest.fixture
def classifier():
    return WeatherClassifier()

def test_classify_rainfall(classifier):
    result = classifier.classify("Heavy rain in Delhi, streets are flooded")
    assert result["event_type"] == "rainfall"
    assert result["confidence"] > 0.7

def test_classify_heatwave(classifier):
    result = classifier.classify("Temperature reached 48°C in Rajasthan")
    assert result["event_type"] == "heatwave"
    assert result["confidence"] > 0.7

def test_classify_empty_text(classifier):
    with pytest.raises(ValueError):
        classifier.classify("")

def test_classify_batch(classifier):
    texts = [
        "Heavy rain in Delhi",
        "Extreme heat in Rajasthan",
        "Lightning struck a house"
    ]
    results = classifier.classify_batch(texts)
    assert len(results) == 3
    assert all("event_type" in r for r in results)
```

---

### API Tests

```python
# apps/ml/app/tests/test_api.py
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_classify():
    response = client.post(
        "/classify",
        json={"text": "Heavy rain in Delhi"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "event_type" in data
    assert "confidence" in data

def test_credibility():
    response = client.post(
        "/credibility",
        json={
            "text": "Detailed description of weather event",
            "source": "citizen",
            "has_media": True,
            "location_valid": True
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "score" in data
    assert 0 <= data["score"] <= 100

def test_duplicates():
    response = client.post(
        "/duplicates",
        json={
            "text": "Heavy rain in Delhi",
            "existing_texts": [
                "Delhi receives heavy rainfall",
                "Mumbai sees clear skies"
            ]
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "is_duplicate" in data
    assert "similarity_score" in data
```

---

### Running ML Tests

```bash
cd apps/ml
source .venv/bin/activate

# All tests
pytest

# Specific test file
pytest app/tests/test_classifier.py

# With coverage
pytest --cov=app

# Verbose output
pytest -v
```

---

## 4. Test Data

### Creating Test Users

```typescript
// scripts/create-test-user.ts
const testUser = {
  email: 'test@example.com',
  password: 'password123',
  name: 'Test User',
};

// Register via API
const response = await fetch('http://localhost:3001/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(testUser),
});
```

### Creating Test Reports

```typescript
// scripts/create-test-report.ts
const testReport = {
  title: 'Test Report',
  description: 'This is a test weather report for testing purposes.',
  eventType: 'rainfall',
  latitude: 28.6139,
  longitude: 77.2090,
  city: 'Delhi',
  state: 'Delhi',
  reportDate: new Date().toISOString(),
};

const response = await fetch('http://localhost:3001/reports', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`,
  },
  body: JSON.stringify(testReport),
});
```

---

## 5. Coverage Requirements

| Service | Minimum Coverage |
|---------|------------------|
| NestJS Backend | 70% |
| Next.js Frontend | 60% |
| FastAPI ML Service | 70% |

**Check coverage:**
```bash
# NestJS
cd apps/api && pnpm test -- --coverage

# Next.js
cd apps/web && pnpm test -- --coverage

# FastAPI
cd apps/ml && pytest --cov=app --cov-report=html
```

---

## 6. CI/CD Testing

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - uses: pnpm/action-setup@v4
      - run: pnpm install
      - run: pnpm test --filter=api

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - uses: pnpm/action-setup@v4
      - run: pnpm install
      - run: pnpm test --filter=web

  ml-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      - run: |
          cd apps/ml
          python -m venv .venv
          source .venv/bin/activate
          pip install -r requirements.txt
          pytest
```

---

## 7. Manual Testing Checklist

### Authentication
- [ ] Register new citizen account
- [ ] Login with valid credentials
- [ ] Login with invalid credentials (should fail)
- [ ] Access protected route without token (should fail)
- [ ] Access admin route as citizen (should fail)

### Reports
- [ ] Create report with all fields
- [ ] Create report without optional fields
- [ ] View paginated report list
- [ ] Filter reports by event type
- [ ] Filter reports by date range
- [ ] Filter reports by location
- [ ] View single report detail
- [ ] Update own report
- [ ] Delete own report
- [ ] Try to update other's report (should fail)

### Media
- [ ] Upload image (jpg, png)
- [ ] Upload video (mp4)
- [ ] Upload oversized file (should fail)
- [ ] Upload invalid file type (should fail)
- [ ] Delete uploaded media

### Verification
- [ ] Verify report as admin
- [ ] Mark report as unverified
- [ ] Mark report as suspicious
- [ ] View verification history
- [ ] Try to verify as citizen (should fail)

### Alerts
- [ ] Verify report triggers alert
- [ ] View active alerts
- [ ] Dismiss alert as admin
- [ ] Try to dismiss as citizen (should fail)

### Map
- [ ] Map loads with markers
- [ ] Click marker shows popup
- [ ] Filter by event type
- [ ] Toggle heatmap layer
- [ ] Map responsive on mobile

### Dashboard
- [ ] Stats cards show correct counts
- [ ] Recent reports list populated
- [ ] Event chart displays data
- [ ] Alert banner shows active alerts
- [ ] Filters update dashboard
