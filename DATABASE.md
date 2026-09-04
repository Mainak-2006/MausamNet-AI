# MausamNet-AI — Database Schema

## Overview

- **Database:** PostgreSQL 16+ with PostGIS 3.4+ extension
- **ORM:** TypeORM
- **Naming convention:** camelCase in code, snake_case in PostgreSQL (TypeORM default)
- **Primary keys:** UUID (auto-generated)
- **Timestamps:** `createdAt` and `updatedAt` on all entities

---

## Entity Relationship Diagram

```
┌──────────────┐       ┌──────────────────┐       ┌──────────────┐
│    users      │       │     reports       │       │    media      │
├──────────────┤       ├──────────────────┤       ├──────────────┤
│ id (PK, UUID)│◄──┐   │ id (PK, UUID)    │◄──┐   │ id (PK, UUID)│
│ email        │   │   │ userId (FK)      │───┘   │ reportId(FK) │──┐
│ password     │   │   │ title            │       │ type         │  │
│ name         │   │   │ description      │       │ url          │  │
│ role (enum)  │   │   │ eventType (enum) │       │ cloudinaryId │  │
│ createdAt    │   │   │ latitude         │       │ createdAt    │  │
│ updatedAt    │   │   │ longitude        │       └──────────────┘  │
└──────────────┘   │   │ city             │                         │
                   │   │ state            │                         │
                   │   │ country          │                         │
                   │   │ source           │                         │
                   │   │ sourceUrl        │                         │
                   │   │ reportDate       │                         │
                   │   │ verificationStatus (enum)                  │
                   │   │ credibilityScore │                         │
                   │   │ isDuplicate      │                         │
                   │   │ duplicateOfId    │                         │
                   │   │ createdAt        │                         │
                   │   │ updatedAt        │                         │
                   │   └───────┬──────────┘                         │
                   │           │                                    │
                   │           ├───┬────────────┐                   │
                   │           │   │            │                   │
                   │           ▼   ▼            ▼                   │
                   │   ┌──────────────┐  ┌──────────────┐          │
                   │   │ verifications│  │    alerts     │          │
                   │   ├──────────────┤  ├──────────────┤          │
                   │   │ id (PK, UUID)│  │ id (PK, UUID)│          │
                   │   │ reportId(FK) │  │ reportId(FK) │          │
                   └───│ userId (FK)  │  │ title        │          │
                       │ status (enum)│  │ message      │          │
                       │ notes        │  │ eventType    │          │
                       │ createdAt    │  │ severity     │          │
                       └──────────────┘  │ isActive     │          │
                                         │ createdAt    │          │
                                         └──────────────┘          │
                                                                   │
                                         ┌──────────────┐          │
                                         │    media      │          │
                                         ├──────────────┤          │
                                         │ id (PK, UUID)│          │
                                         │ reportId(FK) │──────────┘
                                         │ type         │
                                         │ url          │
                                         │ cloudinaryId │
                                         │ createdAt    │
                                         └──────────────┘
```

---

## Tables

### 1. users

Stores registered users (citizens and admins).

```sql
CREATE TYPE "users_role_enum" AS ENUM ('citizen', 'admin');

CREATE TABLE "users" (
    "id"         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "email"      VARCHAR(255) NOT NULL UNIQUE,
    "password"   VARCHAR(255) NOT NULL,
    "name"       VARCHAR(255) NOT NULL,
    "role"       "users_role_enum" NOT NULL DEFAULT 'citizen',
    "createdAt"  TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt"  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX "IDX_users_email" ON "users" ("email");
```

**Fields:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, auto | Unique identifier |
| email | VARCHAR(255) | UNIQUE, NOT NULL | User email |
| password | VARCHAR(255) | NOT NULL | bcrypt hashed password |
| name | VARCHAR(255) | NOT NULL | Display name |
| role | ENUM | NOT NULL, default 'citizen' | User role |
| createdAt | TIMESTAMP | NOT NULL, default NOW() | Creation time |
| updatedAt | TIMESTAMP | NOT NULL, auto-update | Last update time |

---

### 2. reports

Stores weather reports submitted by citizens or collected from APIs.

```sql
CREATE TYPE "reports_eventtype_enum" AS ENUM (
    'rainfall', 'flood', 'thunderstorm', 'heatwave',
    'strong_wind', 'cyclone', 'drought', 'other'
);

CREATE TYPE "reports_verificationstatus_enum" AS ENUM (
    'pending', 'verified', 'unverified', 'suspicious'
);

CREATE TABLE "reports" (
    "id"                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId"              UUID NOT NULL REFERENCES "users"("id"),
    "title"               VARCHAR(500) NOT NULL,
    "description"         TEXT NOT NULL,
    "eventType"           "reports_eventtype_enum" NOT NULL,
    "latitude"            DOUBLE PRECISION NOT NULL,
    "longitude"           DOUBLE PRECISION NOT NULL,
    "city"                VARCHAR(255) NOT NULL,
    "state"               VARCHAR(255) NOT NULL,
    "country"             VARCHAR(255) NOT NULL DEFAULT 'India',
    "source"              VARCHAR(100) NOT NULL DEFAULT 'citizen',
    "sourceUrl"           VARCHAR(1000),
    "reportDate"          TIMESTAMP NOT NULL,
    "verificationStatus"  "reports_verificationstatus_enum" NOT NULL DEFAULT 'pending',
    "credibilityScore"    DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "isDuplicate"         BOOLEAN NOT NULL DEFAULT FALSE,
    "duplicateOfId"       UUID,
    "createdAt"           TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt"           TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX "IDX_reports_userid" ON "reports" ("userId");
CREATE INDEX "IDX_reports_eventtype" ON "reports" ("eventType");
CREATE INDEX "IDX_reports_verificationstatus" ON "reports" ("verificationStatus");
CREATE INDEX "IDX_reports_city_state" ON "reports" ("city", "state");
CREATE INDEX "IDX_reports_reportdate" ON "reports" ("reportDate");
CREATE INDEX "IDX_reports_createdat" ON "reports" ("createdAt");
```

**Fields:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, auto | Unique identifier |
| userId | UUID | FK → users.id, NOT NULL | Submitter |
| title | VARCHAR(500) | NOT NULL | Short summary |
| description | TEXT | NOT NULL | Detailed description |
| eventType | ENUM | NOT NULL | Weather event type |
| latitude | DOUBLE PRECISION | NOT NULL | GPS latitude |
| longitude | DOUBLE PRECISION | NOT NULL | GPS longitude |
| city | VARCHAR(255) | NOT NULL | City name |
| state | VARCHAR(255) | NOT NULL | State name |
| country | VARCHAR(255) | NOT NULL, default 'India' | Country |
| source | VARCHAR(100) | NOT NULL, default 'citizen' | Data source |
| sourceUrl | VARCHAR(1000) | nullable | Source URL |
| reportDate | TIMESTAMP | NOT NULL | When event occurred |
| verificationStatus | ENUM | NOT NULL, default 'pending' | Verification state |
| credibilityScore | DOUBLE PRECISION | NOT NULL, default 0.0 | Score 0-100 |
| isDuplicate | BOOLEAN | NOT NULL, default FALSE | Duplicate flag |
| duplicateOfId | UUID | nullable | Original report ID |
| createdAt | TIMESTAMP | NOT NULL, default NOW() | Creation time |
| updatedAt | TIMESTAMP | NOT NULL, auto-update | Last update time |

---

### 3. media

Stores references to uploaded images/videos on Cloudinary.

```sql
CREATE TABLE "media" (
    "id"            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "reportId"      UUID NOT NULL REFERENCES "reports"("id") ON DELETE CASCADE,
    "type"          VARCHAR(50) NOT NULL,
    "url"           VARCHAR(1000) NOT NULL,
    "cloudinaryId"  VARCHAR(500) NOT NULL,
    "createdAt"     TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX "IDX_media_reportid" ON "media" ("reportId");
```

**Fields:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, auto | Unique identifier |
| reportId | UUID | FK → reports.id, CASCADE DELETE, NOT NULL | Parent report |
| type | VARCHAR(50) | NOT NULL | "image" or "video" |
| url | VARCHAR(1000) | NOT NULL | Cloudinary URL |
| cloudinaryId | VARCHAR(500) | NOT NULL | Cloudinary public ID |
| createdAt | TIMESTAMP | NOT NULL, default NOW() | Upload time |

---

### 4. verifications

Stores admin verification actions (audit trail).

```sql
CREATE TYPE "verifications_status_enum" AS ENUM (
    'pending', 'verified', 'unverified', 'suspicious'
);

CREATE TABLE "verifications" (
    "id"        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "reportId"  UUID NOT NULL REFERENCES "reports"("id") ON DELETE CASCADE,
    "userId"    UUID NOT NULL REFERENCES "users"("id"),
    "status"    "verifications_status_enum" NOT NULL,
    "notes"     TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX "IDX_verifications_reportid" ON "verifications" ("reportId");
CREATE INDEX "IDX_verifications_userid" ON "verifications" ("userId");
```

**Fields:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, auto | Unique identifier |
| reportId | UUID | FK → reports.id, CASCADE DELETE, NOT NULL | Report being verified |
| userId | UUID | FK → users.id, NOT NULL | Admin who verified |
| status | ENUM | NOT NULL | Verification decision |
| notes | TEXT | nullable | Admin notes |
| createdAt | TIMESTAMP | NOT NULL, default NOW() | Action time |

---

### 5. alerts

Stores generated weather alerts.

```sql
CREATE TYPE "alerts_eventtype_enum" AS ENUM (
    'rainfall', 'flood', 'thunderstorm', 'heatwave',
    'strong_wind', 'cyclone', 'drought', 'other'
);

CREATE TABLE "alerts" (
    "id"          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "reportId"    UUID NOT NULL REFERENCES "reports"("id") ON DELETE CASCADE,
    "title"       VARCHAR(500) NOT NULL,
    "message"     TEXT NOT NULL,
    "eventType"   "alerts_eventtype_enum" NOT NULL,
    "severity"    VARCHAR(50) NOT NULL DEFAULT 'medium',
    "isActive"    BOOLEAN NOT NULL DEFAULT TRUE,
    "createdAt"   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX "IDX_alerts_reportid" ON "alerts" ("reportId");
CREATE INDEX "IDX_alerts_eventtype" ON "alerts" ("eventType");
CREATE INDEX "IDX_alerts_severity" ON "alerts" ("severity");
CREATE INDEX "IDX_alerts_isactive" ON "alerts" ("isActive");
```

**Fields:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, auto | Unique identifier |
| reportId | UUID | FK → reports.id, CASCADE DELETE, NOT NULL | Source report |
| title | VARCHAR(500) | NOT NULL | Alert title |
| message | TEXT | NOT NULL | Alert description |
| eventType | ENUM | NOT NULL | Weather event type |
| severity | VARCHAR(50) | NOT NULL, default 'medium' | low/medium/high/critical |
| isActive | BOOLEAN | NOT NULL, default TRUE | Active flag |
| createdAt | TIMESTAMP | NOT NULL, default NOW() | Creation time |

---

## Enums

### users_role_enum
```sql
CREATE TYPE "users_role_enum" AS ENUM ('citizen', 'admin');
```

### reports_eventtype_enum
```sql
CREATE TYPE "reports_eventtype_enum" AS ENUM (
    'rainfall', 'flood', 'thunderstorm', 'heatwave',
    'strong_wind', 'cyclone', 'drought', 'other'
);
```

### reports_verificationstatus_enum
```sql
CREATE TYPE "reports_verificationstatus_enum" AS ENUM (
    'pending', 'verified', 'unverified', 'suspicious'
);
```

---

## Indexes Summary

| Table | Index | Columns | Purpose |
|-------|-------|---------|---------|
| users | IDX_users_email | email | Fast login lookup |
| reports | IDX_reports_userid | userId | User's reports |
| reports | IDX_reports_eventtype | eventType | Filter by event |
| reports | IDX_reports_verificationstatus | verificationStatus | Filter by status |
| reports | IDX_reports_city_state | city, state | Location filter |
| reports | IDX_reports_reportdate | reportDate | Date range queries |
| reports | IDX_reports_createdat | createdAt | Sorting |
| media | IDX_media_reportid | reportId | Report's media |
| verifications | IDX_verifications_reportid | reportId | Report's verifications |
| verifications | IDX_verifications_userid | userId | Admin's actions |
| alerts | IDX_alerts_reportid | reportId | Source report |
| alerts | IDX_alerts_eventtype | eventType | Filter by event |
| alerts | IDX_alerts_severity | severity | Filter by severity |
| alerts | IDX_alerts_isactive | isActive | Active alerts |

---

## Migration Strategy

### Creating Migrations

```bash
# Generate migration from entity changes
cd apps/api
npx typeorm-ts-node-commonjs -d src/data-source.ts migration:generate src/migrations/MigrationName

# Create empty migration
npx typeorm-ts-node-commonjs migration:create src/migrations/MigrationName
```

### Running Migrations

```bash
# Run all pending migrations
npx typeorm-ts-node-commonjs -d src/data-source.ts migration:run

# Revert last migration
npx typeorm-ts-node-commonjs -d src/data-source.ts migration:revert

# Show migration status
npx typeorm-ts-node-commonjs -d src/data-source.ts migration:show
```

### Initial Migration

The first migration (`1700000000000-CreateInitialSchema.ts`) creates:
1. `uuid-ossp` extension
2. `PostGIS` extension
3. All enum types
4. All tables with constraints and indexes

---

## Seed Data

### Admin User
```sql
INSERT INTO "users" ("email", "password", "name", "role")
VALUES (
    'admin@mausamnet.gov.in',
    '$2b$12$LJ3m4ys1G.dh9eV2O8x0KeQxQxQxQxQxQxQxQxQxQxQxQxQxQx',
    'System Admin',
    'admin'
);
-- Password: admin123 (bcrypt hashed with 12 rounds)
```

### Sample Reports
20-30 reports across different:
- Event types (rain, flood, heatwave, etc.)
- Indian cities (Delhi, Mumbai, Chennai, Kolkata, etc.)
- Verification statuses (pending, verified, suspicious)
- Credibility scores (30-95)
- Dates (last 30 days)
