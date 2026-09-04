# MausamNet-AI — System Architecture

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTS                                 │
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │   Web Browser     │  │   Admin Panel     │                    │
│  │   (Citizen)       │  │   (Admin)         │                    │
│  └────────┬─────────┘  └────────┬─────────┘                    │
│           │                     │                               │
│           └──────────┬──────────┘                               │
│                      │                                          │
│                      ▼                                          │
│  ┌─────────────────────────────────────┐                       │
│  │        Next.js Frontend (:3000)      │                       │
│  │                                       │                       │
│  │  ┌─────────┐ ┌──────┐ ┌──────────┐  │                       │
│  │  │Dashboard│ │ Map  │ │ Reports  │  │                       │
│  │  └─────────┘ └──────┘ └──────────┘  │                       │
│  │  ┌─────────┐ ┌──────┐ ┌──────────┐  │                       │
│  │  │ Submit  │ │Admin │ │ Alerts   │  │                       │
│  │  └─────────┘ └──────┘ └──────────┘  │                       │
│  └──────────────────┬──────────────────┘                       │
│                     │ HTTP (REST API)                           │
│                     ▼                                           │
│  ┌─────────────────────────────────────┐                       │
│  │        NestJS Backend (:3001)        │                       │
│  │                                       │                       │
│  │  ┌──────┐ ┌────────┐ ┌───────────┐  │                       │
│  │  │ Auth │ │Reports │ │Verification│  │                       │
│  │  └──────┘ └────────┘ └───────────┘  │                       │
│  │  ┌──────┐ ┌────────┐ ┌───────────┐  │                       │
│  │  │Media │ │ Alerts │ │Weather API│  │                       │
│  │  └──────┘ └────────┘ └───────────┘  │                       │
│  │  ┌──────────────┐ ┌──────────────┐  │                       │
│  │  │Classification│ │ Credibility  │  │                       │
│  │  └──────────────┘ └──────────────┘  │                       │
│  └──────┬───────────────┬──────────────┘                       │
│         │               │                                       │
│         ▼               ▼                                       │
│  ┌────────────┐  ┌─────────────────────────────────────┐       │
│  │ PostgreSQL  │  │       FastAPI ML Service (:8000)      │       │
│  │ + PostGIS   │  │                                       │       │
│  │ (:5432)     │  │  ┌───────────┐ ┌──────────────────┐ │       │
│  │             │  │  │ Classifier │ │ Credibility      │ │       │
│  │ ┌────────┐  │  │  └───────────┘ └──────────────────┘ │       │
│  │ │ reports│  │  │  ┌───────────┐ ┌──────────────────┐ │       │
│  │ │ users  │  │  │  │ Duplicates│ │ NLP Preprocess   │ │       │
│  │ │ media  │  │  │  └───────────┘ └──────────────────┘ │       │
│  │ │ alerts │  │  └─────────────────────────────────────┘       │
│  │ └────────┘  │                                               │
│  └────────────┘  ┌─────────────────────────────────────┐       │
│                   │         External APIs                  │       │
│                   │  ┌──────────┐  ┌──────────────────┐ │       │
│                   │  │OpenWeather│  │       IMD        │ │       │
│                   │  └──────────┘  └──────────────────┘ │       │
│                   └─────────────────────────────────────┘       │
│                                                                 │
│                   ┌─────────────────────────────────────┐       │
│                   │         Cloudinary (CDN)             │       │
│                   │   Image/Video Storage & Delivery     │       │
│                   └─────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Service Responsibilities

### 2.1 Next.js Frontend (`apps/web`)

| Responsibility | Implementation |
|----------------|----------------|
| User interface | React components with Tailwind CSS |
| Route management | App Router with file-based routing |
| State management | React Context + hooks |
| API communication | Axios wrapper with JWT interceptor |
| Map rendering | Leaflet via react-leaflet |
| Form handling | React Hook Form or controlled components |

**Port:** 3000

### 2.2 NestJS Backend (`apps/api`)

| Responsibility | Implementation |
|----------------|----------------|
| Authentication | Passport + JWT strategy |
| Authorization | Global guards with role decorators |
| Data validation | class-validator DTOs |
| Business logic | Service layer pattern |
| Database access | TypeORM repositories |
| External API calls | Axios HTTP client |
| File uploads | Multer + Cloudinary |

**Port:** 3001

### 2.3 FastAPI ML Service (`apps/ml`)

| Responsibility | Implementation |
|----------------|----------------|
| Text classification | TF-IDF + Logistic Regression |
| Credibility scoring | Multi-factor scoring algorithm |
| Duplicate detection | Cosine similarity |
| Text preprocessing | Tokenization, stop word removal |

**Port:** 8000

### 2.4 PostgreSQL Database

| Responsibility | Implementation |
|----------------|----------------|
| Data persistence | TypeORM-managed schema |
| Geospatial queries | PostGIS extension |
| Full-text search | PostgreSQL text search (future) |
| Data integrity | Foreign keys, constraints, enums |

**Port:** 5432

---

## 3. Data Flow

### 3.1 Report Submission Flow

```
Citizen fills form
        ↓
Next.js validates input
        ↓
POST /api/reports (with JWT)
        ↓
NestJS AuthGuard validates token
        ↓
ReportsController.create()
        ↓
ReportsService.create()
        ├── 1. Save report to PostgreSQL
        ├── 2. POST /classify → ML Service
        │       └── Returns: { eventType, confidence }
        ├── 3. POST /credibility → ML Service
        │       └── Returns: { score, factors }
        ├── 4. POST /duplicates → ML Service
        │       └── Returns: { isDuplicate, similarity }
        ├── 5. Update report with classification + score
        └── 6. If has media → Cloudinary upload
        ↓
Report saved with all metadata
        ↓
Response returned to frontend
```

### 3.2 Verification Flow

```
Admin reviews report in admin panel
        ↓
Clicks "Verify" button
        ↓
POST /api/verify/:reportId (with admin JWT)
        ↓
VerificationService.verify()
        ├── 1. Create Verification record (audit trail)
        ├── 2. Update report.verificationStatus
        ├── 3. If status=verified AND credibility > threshold:
        │       └── AlertService.create() → Generate alert
        └── 4. Return updated report
        ↓
Frontend refreshes report + alerts
```

### 3.3 Weather Data Sync Flow

```
Cron job triggers (hourly)
        ↓
WeatherService.syncWeatherData()
        ├── 1. Fetch from OpenWeather API for configured cities
        ├── 2. Compare with existing data
        ├── 3. Create reports for new weather data
        └── 4. Auto-classify via ML service
        ↓
New reports appear in system
```

---

## 4. Module Structure (NestJS)

```
src/
├── app.module.ts              # Root module
├── main.ts                    # Bootstrap
├── auth/                      # Authentication
│   ├── auth.module.ts
│   ├── auth.service.ts
│   ├── auth.controller.ts
│   ├── jwt.strategy.ts
│   ├── jwt-auth.guard.ts
│   ├── roles.guard.ts
│   ├── decorators/
│   └── dto/
├── users/                     # User management
│   ├── users.module.ts
│   ├── users.service.ts
│   ├── users.controller.ts
│   ├── user.entity.ts
│   └── dto/
├── reports/                   # Weather reports
│   ├── reports.module.ts
│   ├── reports.service.ts
│   ├── reports.controller.ts
│   ├── report.entity.ts
│   └── dto/
├── media/                     # File uploads
│   ├── media.module.ts
│   ├── media.service.ts
│   ├── media.controller.ts
│   └── media.entity.ts
├── cloudinary/                # Cloudinary provider
│   ├── cloudinary.module.ts
│   ├── cloudinary.service.ts
│   └── cloudinary.provider.ts
├── verification/              # Admin verification
│   ├── verification.module.ts
│   ├── verification.service.ts
│   ├── verification.controller.ts
│   └── verification.entity.ts
├── alerts/                    # Alert system
│   ├── alerts.module.ts
│   ├── alerts.service.ts
│   ├── alerts.controller.ts
│   └── alert.entity.ts
├── weather/                   # Weather API integration
│   ├── weather.module.ts
│   ├── weather.service.ts
│   └── weather.controller.ts
├── classification/            # ML service client
│   ├── classification.module.ts
│   ├── classification.service.ts
│   └── classification.controller.ts
├── credibility/               # Credibility scoring
│   ├── credibility.module.ts
│   ├── credibility.service.ts
│   └── credibility.controller.ts
└── data-source.ts             # TypeORM CLI DataSource
```

---

## 5. Frontend Route Structure (Next.js)

```
app/
├── layout.tsx                 # Root layout (sidebar + theme)
├── page.tsx                   # Landing/redirect to dashboard
├── loading.tsx                # Global loading state
├── error.tsx                  # Global error boundary
├── not-found.tsx              # 404 page
│
├── (auth)/                    # Route group (no /auth prefix)
│   ├── login/
│   │   └── page.tsx          # Login form
│   └── register/
│       └── page.tsx          # Registration form
│
├── dashboard/
│   ├── layout.tsx            # Dashboard layout
│   └── page.tsx              # Main dashboard
│
├── map/
│   └── page.tsx              # Interactive weather map
│
├── reports/
│   ├── page.tsx              # Reports list with filters
│   └── [id]/
│       └── page.tsx          # Single report detail
│
├── submit/
│   └── page.tsx              # Citizen report submission
│
├── admin/
│   ├── layout.tsx            # Admin layout (role-guarded)
│   └── page.tsx              # Admin verification panel
│
├── alerts/
│   └── page.tsx              # Alerts list
│
└── api/                      # Next.js API routes (if needed)
    └── ...
```

---

## 6. Component Architecture

### 6.1 Component Hierarchy

```
RootLayout
├── Sidebar
│   ├── Logo
│   ├── NavLinks (role-gated)
│   └── UserProfile
├── Header
│   ├── SearchBar
│   ├── Notifications
│   └── UserMenu
└── PageContent (children)
    ├── DashboardPage
    │   ├── StatsCards
    │   ├── RecentReports
    │   ├── MiniMap
    │   ├── EventChart
    │   └── AlertBanner
    ├── MapPage
    │   ├── WeatherMap
    │   │   ├── EventMarkers
    │   │   ├── EventPopups
    │   │   └── HeatmapLayer
    │   ├── MapFilters
    │   └── MapLegend
    ├── ReportsPage
    │   ├── ReportFilters
    │   ├── ReportTable
    │   └── Pagination
    ├── ReportDetailPage
    │   ├── ReportInfo
    │   ├── MediaGallery
    │   ├── ReportMap
    │   ├── CredibilityBadge
    │   └── VerificationTimeline
    ├── SubmitPage
    │   ├── FormProgress
    │   ├── StepEventDetails
    │   ├── StepLocation
    │   ├── StepMedia
    │   └── StepReview
    ├── AdminPage
    │   ├── ReportQueue
    │   ├── VerifyActions
    │   ├── AdminStats
    │   └── BulkActions
    └── AlertsPage
        ├── AlertCard
        ├── AlertFilters
        └── AlertDetail
```

---

## 7. Security Architecture

```
Request
    ↓
CORS Middleware (allow frontend origin)
    ↓
Body Parser (JSON, multipart)
    ↓
Global ValidationPipe (DTO validation)
    ↓
JwtAuthGuard (verify Bearer token)
    ↓
RolesGuard (check @Roles() metadata)
    ↓
Controller Handler
    ↓
Service Layer
    ↓
Repository (TypeORM)
    ↓
PostgreSQL
```

**Authentication Flow:**
```
1. User sends POST /auth/register with {email, password, name}
2. AuthService hashes password with bcrypt (12 rounds)
3. User record created in PostgreSQL
4. JWT signed with {sub: userId, email, role} payload
5. Token returned to client

6. User sends POST /auth/login with {email, password}
7. AuthService finds user, verifies password with bcrypt.compare()
8. JWT signed and returned

9. User sends request with Authorization: Bearer <token>
10. JwtStrategy extracts token, verifies signature
11. validate() returns {id, email, role} to request.user
12. RolesGuard checks if user.role matches @Roles() if present
13. Request proceeds to controller handler
```

---

## 8. External Integrations

### 8.1 OpenWeather API

```
GET https://api.openweathermap.org/data/2.5/weather?q={city}&appid={key}
```

Returns: temperature, humidity, wind speed, weather description, coordinates.

### 8.2 Cloudinary

```
Upload: POST https://api.cloudinary.com/v1_1/{cloud}/auto/upload
Delete: POST https://api.cloudinary.com/v1_1/{cloud}/image/destroy
```

Used for: Image/video storage, URL generation, transformations.

### 8.3 FastAPI ML Service

Internal HTTP calls from NestJS:

```
POST http://localhost:8000/classify
POST http://localhost:8000/credibility
POST http://localhost:8000/duplicates
POST http://localhost:8000/preprocess
GET  http://localhost:8000/health
```

---

## 9. Deployment Architecture (Future)

```
                    ┌─────────────────┐
                    │   Load Balancer  │
                    │   (nginx/ALB)    │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
        ┌──────────┐  ┌──────────┐  ┌──────────┐
        │ Next.js  │  │ Next.js  │  │ NestJS   │
        │ Instance │  │ Instance │  │ Instance │
        └────┬─────┘  └────┬─────┘  └────┬─────┘
             │              │              │
             └──────┬───────┘              │
                    │                      │
                    ▼                      ▼
              ┌──────────┐          ┌──────────┐
              │ PostgreSQL│          │ FastAPI  │
              │ (Primary) │          │ ML Svc   │
              └──────────┘          └──────────┘
```

**MVP:** Single instances on localhost
**Future:** Containerized (Docker), orchestrated (Kubernetes), cloud-hosted
