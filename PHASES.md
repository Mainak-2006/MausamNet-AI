# MausamNet-AI — Implementation Phases

## Overview

The MVP is built in **6 phases** across **29 steps**. Each phase produces a working increment that can be tested independently.

```
Phase 1: Scaffolding (Steps 1-5)
    ↓
Phase 2: Core Backend (Steps 6-12)
    ↓
Phase 3: ML Service (Steps 13-14)
    ↓
Phase 4: Backend Integration (Steps 15-20)
    ↓
Phase 5: Frontend (Steps 21-27)
    ↓
Phase 6: Polish (Steps 28-29)
```

---

## Phase 1: Project Scaffolding (Steps 1-5)

**Goal:** Get all project shells running so we can build features incrementally.

**Deliverable:** Empty but runnable apps for Next.js, NestJS, and FastAPI.

| Step | Task | Files | Effort |
|------|------|-------|--------|
| 1 | Git init, root config, Turborepo | 6 | ~30 min |
| 2 | Scaffold Next.js app | 1 | ~45 min |
| 3 | Scaffold NestJS app | 1 | ~1 hr |
| 4 | Scaffold FastAPI service | 3 | ~30 min |
| 5 | Shared types package | 3 | ~30 min |

**Phase 1 Total:** ~14 files, ~3 hours

---

## Phase 2: Core Backend (Steps 6-12)

**Goal:** Working database, authentication, and all backend CRUD operations.

**Deliverable:** NestJS API with auth, reports CRUD, media uploads, and TypeORM entities.

| Step | Task | Files | Effort |
|------|------|-------|--------|
| 6 | TypeORM entities + DataSource + migrations | 8 | ~2 hrs |
| 7 | App module setup (TypeORM, Config, Guards) | 2 | ~1 hr |
| 8 | Auth module (register, login, JWT, guards) | 10 | ~2 hrs |
| 9 | Users module | 3 | ~45 min |
| 10 | Cloudinary module | 4 | ~1 hr |
| 11 | Reports module (CRUD + filters) | 6 | ~3 hrs |
| 12 | Media module | 3 | ~1 hr |

**Phase 2 Total:** ~36 files, ~11.25 hours

---

## Phase 3: ML Service (Steps 13-14)

**Goal:** Working Python ML service that classifies weather events.

**Deliverable:** FastAPI endpoints for classification, credibility scoring, and duplicate detection.

| Step | Task | Files | Effort |
|------|------|-------|--------|
| 13 | ML training data + model training | 3 | ~1.5 hrs |
| 14 | FastAPI endpoints (classify, credibility, duplicates) | 6 | ~2 hrs |

**Phase 3 Total:** ~9 files, ~3.5 hours

---

## Phase 4: Backend Integration (Steps 15-20)

**Goal:** Wire ML service into backend, add verification and alerts.

**Deliverable:** Complete backend with all features integrated.

| Step | Task | Files | Effort |
|------|------|-------|--------|
| 15 | Classification module (NestJS → ML client) | 3 | ~1 hr |
| 16 | Credibility module | 3 | ~1 hr |
| 17 | Duplicate detection integration | 2 | ~1 hr |
| 18 | Weather API integration module | 4 | ~1.5 hrs |
| 19 | Verification module | 4 | ~1.5 hrs |
| 20 | Alerts module | 4 | ~1 hr |

**Phase 4 Total:** ~20 files, ~7 hours

---

## Phase 5: Frontend (Steps 21-27)

**Goal:** Complete user-facing interface.

**Deliverable:** Full Next.js frontend with all pages and components.

| Step | Task | Files | Effort |
|------|------|-------|--------|
| 21 | Layout, navigation, auth pages | 8 | ~3 hrs |
| 22 | Dashboard | 5 | ~3 hrs |
| 23 | Interactive map (Leaflet + heatmap) | 5 | ~3 hrs |
| 24 | Reports list + detail | 6 | ~3.5 hrs |
| 25 | Submit report form | 5 | ~3 hrs |
| 26 | Admin panel | 5 | ~2 hrs |
| 27 | Alerts page | 3 | ~1.5 hrs |

**Phase 5 Total:** ~37 files, ~19 hours

---

## Phase 6: Polish (Steps 28-29)

**Goal:** Everything works end-to-end.

**Deliverable:** Tested MVP with seed data, ready for demo.

| Step | Task | Files | Effort |
|------|------|-------|--------|
| 28 | API integration testing | — | ~2 hrs |
| 29 | Seed data (admin user + sample reports) | 2 | ~1 hr |

**Phase 6 Total:** ~2 files, ~3 hours

---

## Summary

| Phase | Steps | Files | Effort |
|-------|-------|-------|--------|
| Phase 1: Scaffolding | 1-5 | ~14 | ~3 hrs |
| Phase 2: Core Backend | 6-12 | ~36 | ~11.25 hrs |
| Phase 3: ML Service | 13-14 | ~9 | ~3.5 hrs |
| Phase 4: Backend Integration | 15-20 | ~20 | ~7 hrs |
| Phase 5: Frontend | 21-27 | ~37 | ~19 hrs |
| Phase 6: Polish | 28-29 | ~2 | ~3 hrs |
| **Total** | **29** | **~118** | **~46.75 hrs** |

---

## Dependency Graph

```
Phase 1 (Scaffolding)
├── Step 1 (Root) ──────────────────────────────┐
│   ├── Step 2 (Next.js)                        │
│   ├── Step 3 (NestJS)                         │
│   │   └── Phase 2 (Core Backend)              │
│   │       ├── Step 6 (Entities)               │
│   │       │   ├── Step 7 (App Module)         │
│   │       │   │   ├── Step 8 (Auth)           │
│   │       │   │   │   ├── Step 9 (Users)      │
│   │       │   │   │   ├── Step 11 (Reports)   │
│   │       │   │   │   │   ├── Step 12 (Media) │
│   │       │   │   │   │   └── Step 19 (Verification)
│   │       │   │   │   │       └── Step 20 (Alerts)
│   │       │   │   │   └── Step 10 (Cloudinary)│
│   │       │   │   └── Step 18 (Weather API)   │
│   ├── Step 4 (FastAPI)                        │
│   │   └── Phase 3 (ML Service)                │
│   │       ├── Step 13 (ML Training)           │
│   │       │   └── Step 14 (ML Endpoints)      │
│   └── Step 5 (Shared Types)                   │
│                                               │
Phase 4 (Backend Integration)                   │
├── Step 15 (Classification) ← Step 14          │
├── Step 16 (Credibility) ← Step 14             │
├── Step 17 (Duplicates) ← Step 14              │
│                                               │
Phase 5 (Frontend) ← Phase 2 + Phase 4          │
├── Step 21 (Layout + Auth) ← Step 8            │
├── Step 22 (Dashboard) ← Steps 11, 20          │
├── Step 23 (Map) ← Step 11                     │
├── Step 24 (Reports) ← Step 11                 │
├── Step 25 (Submit) ← Steps 11, 12, 15         │
├── Step 26 (Admin) ← Step 19                   │
└── Step 27 (Alerts) ← Step 20                  │
                                                │
Phase 6 (Polish) ← All Phases                   │
├── Step 28 (Testing)                           │
└── Step 29 (Seed Data)                         │
```

---

## Parallel Execution Opportunities

| Parallel Group | Steps | Reason |
|----------------|-------|--------|
| Scaffolding | Steps 2, 3, 4, 5 | All independent shells |
| ML + Backend | Steps 6-12 parallel with 13-14 | ML service is independent |
| Frontend pages | Steps 22-27 can partially overlap | Each page is somewhat independent |

---

## Milestones

| Milestone | Phase | Description | Demo Capability |
|-----------|-------|-------------|-----------------|
| M1 | Phase 1 complete | All apps scaffolded | Can start all 3 services |
| M2 | Phase 2 complete | Backend fully functional | Can register, login, create/view reports via API |
| M3 | Phase 3 complete | ML service operational | Can classify weather events via API |
| M4 | Phase 4 complete | Backend + ML integrated | Full pipeline: submit → classify → verify → alert |
| M5 | Phase 5 complete | Frontend complete | Full working web application |
| M6 | Phase 6 complete | MVP ready | Demo-ready with seed data |
