# MausamNet-AI — MVP Requirements Document

## 1. Project Overview

**Name:** MausamNet-AI — National Weather Big Data Analytics Platform

**One-Line Description:** A web-based platform that collects weather reports from APIs and citizens, classifies and verifies them using basic AI techniques, stores them in a centralized database, and displays verified weather events through an interactive dashboard and map.

**MVP Goal:** Build the smallest functional version that can collect weather-related information, analyse it, perform basic verification, store the data centrally, and display useful information through a dashboard and map.

---

## 2. Core MVP Features

### 2.1 Weather Data Collection

| Requirement | Priority | Details |
|-------------|----------|---------|
| Collect real-time weather data via APIs | P0 | OpenWeather API, IMD API |
| Allow citizens to submit weather reports manually | P0 | Multi-step form with text, location, media |
| Collect weather-related info from public sources | P1 | Future enhancement, not critical for MVP |

**Acceptance Criteria:**
- Citizens can register and submit reports via web form
- System fetches weather data from OpenWeather API for configured cities
- Reports include text description, location, event type, and optional media

---

### 2.2 Weather Event Classification

| Requirement | Priority | Details |
|-------------|----------|---------|
| Automatic classification into major weather events | P0 | ML-based text classification |

**Supported Event Types:**

| Event Type | Code | Description |
|------------|------|-------------|
| Rainfall | `rainfall` | Heavy rain, showers, precipitation |
| Flood | `flood` | Waterlogging, river overflow, flash floods |
| Thunderstorm | `thunderstorm` | Lightning, thunder, electrical storms |
| Heatwave | `heatwave` | Extreme heat, temperature above 45°C |
| Strong Winds | `strong_wind` | Gusts, cyclonic winds, tornadoes |
| Cyclone | `cyclone` | Tropical cyclones, hurricanes |
| Drought | `drought` | Extended dry periods, water scarcity |
| Other | `other` | Weather events not fitting above categories |

**Acceptance Criteria:**
- When a citizen submits a report, the system automatically classifies the event type
- Classification includes a confidence score (0.0 to 1.0)
- Admin can manually override the classification

---

### 2.3 Basic Report Verification

| Requirement | Priority | Details |
|-------------|----------|---------|
| Source reliability check | P0 | Score based on source type |
| Location validation | P0 | Verify city/state exist in India |
| Duplicate report detection | P0 | Text similarity + location + time |
| Date and time comparison | P1 | Reasonable time window for events |
| Text similarity analysis | P0 | TF-IDF cosine similarity |
| Basic credibility scoring | P0 | Composite score from multiple factors |

**Credibility Score Factors:**

| Factor | Weight | Scoring |
|--------|--------|---------|
| Text quality & length | 25% | Longer, detailed texts score higher |
| Source reliability | 25% | API data > citizen reports > unknown |
| Has media evidence | 20% | Images/videos increase credibility |
| Location provided | 15% | Valid GPS or city/state |
| Text formality | 15% | Formal language scores higher than casual |

**Acceptance Criteria:**
- Every report gets a credibility score (0-100)
- Duplicate reports are flagged automatically
- Suspicious reports are queued for admin review

---

### 2.4 Centralized Database

| Requirement | Priority | Details |
|-------------|----------|---------|
| Store all report data centrally | P0 | PostgreSQL + PostGIS |
| Support geospatial queries | P0 | Nearby reports, area searches |
| Store media references | P0 | Cloudinary URLs + metadata |

**Data Fields Stored:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Date and time | timestamp | Yes | When the event was reported |
| City | string | Yes | City name |
| State | string | Yes | State name |
| Country | string | Yes | Default: "India" |
| GPS/Latitude | float | Yes | Latitude coordinate |
| GPS/Longitude | float | Yes | Longitude coordinate |
| Weather event type | enum | Yes | One of the 8 event types |
| Report description | text | Yes | Detailed text description |
| Title | string | Yes | Short summary |
| Source | string | Yes | "citizen", "openweather", "imd" |
| Verification status | enum | Yes | pending/verified/unverified/suspicious |
| Credibility score | float | Yes | 0.0 to 100.0 |
| Images/videos | media[] | No | Cloudinary URLs |
| User ID | uuid | Yes | Submitting user |

---

### 2.5 Dashboard

| Requirement | Priority | Details |
|-------------|----------|---------|
| Display summary statistics | P0 | Total reports, verified, pending, alerts |
| Show recent reports | P0 | Last 10 reports |
| Weather event distribution | P0 | Pie/bar chart of event types |
| Mini map with latest events | P1 | Small Leaflet map |
| Alert banner | P0 | Critical alerts displayed prominently |

**Filter Options:**
- Date range (from/to)
- Location (city, state)
- Weather event type
- Verification status

**Acceptance Criteria:**
- Dashboard loads within 3 seconds
- Filters update results in real-time
- Mobile-responsive layout

---

### 2.6 Interactive Weather Map

| Requirement | Priority | Details |
|-------------|----------|---------|
| Interactive Leaflet map | P0 | OpenStreetMap tiles |
| Event markers | P0 | Color-coded by event type |
| Marker popups | P0 | Report details on click |
| Heatmap layer | P1 | Toggle heatmap view |
| Map filters | P0 | Filter by event type, date, status |

**Event Type Colors:**

| Event | Color |
|-------|-------|
| Rainfall | Blue (#3388ff) |
| Flood | Dark Blue (#0000cc) |
| Thunderstorm | Yellow (#ffcc00) |
| Heatwave | Red (#ff4444) |
| Strong Wind | Green (#44cc44) |
| Cyclone | Purple (#9933cc) |
| Drought | Orange (#ff8800) |
| Other | Gray (#888888) |

**Acceptance Criteria:**
- Map centered on India (lat: 20.5937, lng: 78.9629, zoom: 5)
- All reports with valid coordinates appear as markers
- Clicking a marker shows report summary
- Heatmap toggle shows event density

---

### 2.7 Admin Verification Panel

| Requirement | Priority | Details |
|-------------|----------|---------|
| Admin-only access | P0 | Role-based route protection |
| Report review queue | P0 | Pending reports listed |
| One-click verify/unverify | P0 | Status change actions |
| Suspicious flagging | P0 | Mark as suspicious |
| Verification notes | P1 | Add notes to verification |
| Bulk actions | P1 | Select multiple + batch verify |
| Credibility score display | P0 | Show score during review |

**Verification Statuses:**

| Status | Description | Who Sets |
|--------|-------------|----------|
| `pending` | New report, awaiting review | System (default) |
| `verified` | Confirmed as accurate | Admin |
| `unverified` | Could not be confirmed | Admin |
| `suspicious` | Appears fake or misleading | Admin |

**Acceptance Criteria:**
- Only users with `admin` role can access
- Verification action creates an audit trail record
- Changing to "verified" + high credibility score triggers alert generation

---

### 2.8 Basic Alerts

| Requirement | Priority | Details |
|-------------|----------|---------|
| Auto-generate alerts | P0 | When significant events are verified |
| Dashboard alerts display | P0 | Active alerts on dashboard |
| Dedicated alerts page | P0 | Full alerts list with filters |
| Alert severity levels | P0 | low, medium, high, critical |
| Dismiss alerts | P1 | Admin can dismiss active alerts |

**Alert Severity Rules:**

| Severity | Condition |
|----------|-----------|
| Critical | Cyclone or Flood verified + credibility > 80 |
| High | Thunderstorm or Heatwave verified + credibility > 70 |
| Medium | Rainfall or Strong Wind verified + credibility > 60 |
| Low | Any other verified event |

**Acceptance Criteria:**
- Alerts are generated automatically upon report verification
- Active alerts appear on dashboard
- Alerts page shows all alerts with filtering

---

## 3. User Roles

### 3.1 Citizen

| Permission | Allowed |
|------------|---------|
| Register account | Yes |
| Submit weather reports | Yes |
| View dashboard | Yes |
| View map | Yes |
| View reports | Yes |
| View alerts | Yes |
| Verify reports | No |
| Access admin panel | No |

### 3.2 Admin

| Permission | Allowed |
|------------|---------|
| All citizen permissions | Yes |
| Verify/unverify/suspicious reports | Yes |
| Access admin panel | Yes |
| Manage users | Yes (future) |
| Dismiss alerts | Yes |
| Bulk operations | Yes |

---

## 4. Non-Functional Requirements

### 4.1 Performance

| Metric | Target |
|--------|--------|
| Dashboard load time | < 3 seconds |
| API response time | < 500ms (p95) |
| Map render time | < 2 seconds |
| ML classification time | < 1 second |

### 4.2 Security

| Requirement | Implementation |
|-------------|----------------|
| Password hashing | bcrypt with 12 salt rounds |
| JWT authentication | Bearer token in Authorization header |
| JWT expiry | 7 days |
| Role-based access | Global guards with `@Roles()` decorator |
| Input validation | `class-validator` DTOs |
| CORS | Configured for frontend origin only |
| Environment secrets | `.env` files, never committed |

### 4.3 Scalability (Future)

| Concern | MVP Approach | Future Scale |
|---------|--------------|--------------|
| Data volume | Single PostgreSQL | Partitioning, read replicas |
| Concurrent users | Single NestJS instance | Load balancing, clustering |
| Real-time updates | REST polling | WebSockets, Server-Sent Events |
| Media storage | Cloudinary free tier | Cloudinary paid / S3 |
| ML inference | Single FastAPI instance | Model serving at scale |

---

## 5. Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | Next.js (App Router) | 16.x |
| UI Framework | React | 19.x |
| Styling | Tailwind CSS | latest |
| Maps | Leaflet + react-leaflet | 1.9+ / 5.0+ |
| Heatmap | leaflet.heat | 0.2+ |
| Backend | NestJS | 11.x |
| ORM | TypeORM | 0.3.x / 1.x |
| Database | PostgreSQL + PostGIS | 16+ / 3.4+ |
| Auth | Passport + JWT | latest |
| Validation | class-validator | latest |
| ML Service | FastAPI (Python) | 0.141+ |
| ML Models | scikit-learn | 1.6+ |
| NLP | TF-IDF + Logistic Regression | — |
| Media Storage | Cloudinary | v2 SDK |
| Monorepo | Turborepo | 2.2+ |
| Package Manager | pnpm | 9+ |
| Language | TypeScript (backend + frontend) | 5.6+ |
| Language | Python (ML service) | 3.12+ |

---

## 6. MVP Workflow

```
Weather API / Citizen Report / Public Source
        ↓
    Data Collection
        ↓
    Data Preprocessing
        ↓
    Duplicate Detection
        ↓
    Weather Event Classification
        ↓
    Credibility Analysis
        ↓
    Central Database
        ↓
    Admin Verification
        ↓
    Dashboard + Interactive Map + Alerts
```

---

## 7. Features NOT Required in Initial MVP

The following are explicitly excluded from the MVP scope:

- [ ] Hadoop / distributed storage
- [ ] Apache Spark for big data processing
- [ ] Apache Kafka for event streaming
- [ ] Complex microservices architecture
- [ ] Advanced deep-learning fake-news detection
- [ ] Full nationwide deployment
- [ ] Advanced video analysis
- [ ] Full multilingual NLP (Hindi/English only for MVP)
- [ ] Mobile app (React Native)
- [ ] Real-time WebSocket updates
- [ ] Advanced analytics / ML dashboards
- [ ] API rate limiting
- [ ] Email notifications
- [ ] SMS alerts
- [ ] OAuth social login

---

## 8. MVP Success Criteria

The MVP will be considered successful if it demonstrates:

- [ ] Weather data entering the system from API and citizen reports
- [ ] Automatic weather event classification with confidence scores
- [ ] Detection of duplicate or suspicious reports
- [ ] Basic credibility scoring on all reports
- [ ] Admin verification of reports with audit trail
- [ ] Weather reports displayed on an interactive map
- [ ] Working dashboard with filters
- [ ] Basic weather alerts generated and displayed

---

## 9. Out of Scope for This Document

- Detailed UI/UX wireframes (see Figma/design files)
- Load testing requirements
- Disaster recovery procedures
- Compliance requirements (GDPR, etc.)
- Third-party API pricing analysis
