# MausamNet-AI — API Documentation

## Base URLs

| Service | URL | Port |
|---------|-----|------|
| NestJS Backend | `http://localhost:3001` | 3001 |
| FastAPI ML Service | `http://localhost:8000` | 8000 |
| Next.js Frontend | `http://localhost:3000` | 3000 |

## Authentication

All protected endpoints require a JWT Bearer token in the `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

To obtain a token, use the `/auth/register` or `/auth/login` endpoints.

---

## 1. Authentication (`/auth`)

### POST /auth/register

Register a new citizen account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe"
}
```

**Response (201):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "citizen"
  }
}
```

**Errors:**
- `400` — Validation error (missing fields, invalid email)
- `409` — Email already exists

---

### POST /auth/login

Login with existing credentials.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "citizen"
  }
}
```

**Errors:**
- `401` — Invalid credentials
- `400` — Validation error

---

### GET /auth/profile

Get current user profile. **Requires authentication.**

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "citizen",
  "createdAt": "2026-01-01T00:00:00.000Z"
}
```

---

## 2. Reports (`/reports`)

### POST /reports

Create a new weather report. **Requires authentication.**

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request:**
```json
{
  "title": "Heavy rainfall in Delhi",
  "description": "Streets are flooded in South Delhi. Water level knee-deep in many areas. Multiple vehicles stuck.",
  "eventType": "rainfall",
  "latitude": 28.6139,
  "longitude": 77.2090,
  "city": "Delhi",
  "state": "Delhi",
  "reportDate": "2026-09-01T14:30:00.000Z"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "userId": "user-uuid",
  "title": "Heavy rainfall in Delhi",
  "description": "Streets are flooded...",
  "eventType": "rainfall",
  "latitude": 28.6139,
  "longitude": 77.2090,
  "city": "Delhi",
  "state": "Delhi",
  "country": "India",
  "source": "citizen",
  "reportDate": "2026-09-01T14:30:00.000Z",
  "verificationStatus": "pending",
  "credibilityScore": 0.0,
  "isDuplicate": false,
  "createdAt": "2026-09-01T14:30:00.000Z"
}
```

**Notes:**
- `eventType` is auto-classified by ML service (can be overridden)
- `credibilityScore` is calculated automatically
- `verificationStatus` defaults to `pending`

---

### GET /reports

Get paginated list of reports with filters. **Requires authentication.**

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page |
| `eventType` | string | — | Filter by event type |
| `verificationStatus` | string | — | Filter by status |
| `city` | string | — | Filter by city (partial match) |
| `state` | string | — | Filter by state (partial match) |
| `dateFrom` | string | — | Start date (ISO 8601) |
| `dateTo` | string | — | End date (ISO 8601) |
| `sortBy` | string | createdAt | Sort field |
| `sortOrder` | string | DESC | Sort direction (ASC/DESC) |

**Example:**
```
GET /reports?eventType=flood&page=1&limit=10&dateFrom=2026-09-01
```

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Heavy rainfall in Delhi",
      "eventType": "rainfall",
      "verificationStatus": "pending",
      "credibilityScore": 75.5,
      "city": "Delhi",
      "state": "Delhi",
      "createdAt": "2026-09-01T14:30:00.000Z"
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 10,
  "totalPages": 15
}
```

---

### GET /reports/:id

Get single report with full details. **Requires authentication.**

**Response (200):**
```json
{
  "id": "uuid",
  "userId": "user-uuid",
  "user": {
    "id": "user-uuid",
    "name": "John Doe",
    "email": "user@example.com"
  },
  "title": "Heavy rainfall in Delhi",
  "description": "Streets are flooded...",
  "eventType": "rainfall",
  "latitude": 28.6139,
  "longitude": 77.2090,
  "city": "Delhi",
  "state": "Delhi",
  "country": "India",
  "source": "citizen",
  "reportDate": "2026-09-01T14:30:00.000Z",
  "verificationStatus": "verified",
  "credibilityScore": 85.0,
  "isDuplicate": false,
  "media": [
    {
      "id": "media-uuid",
      "type": "image",
      "url": "https://res.cloudinary.com/...",
      "cloudinaryId": "reports/abc123"
    }
  ],
  "verifications": [
    {
      "id": "ver-uuid",
      "status": "verified",
      "notes": "Confirmed by local authorities",
      "user": { "name": "Admin User" },
      "createdAt": "2026-09-02T10:00:00.000Z"
    }
  ],
  "createdAt": "2026-09-01T14:30:00.000Z",
  "updatedAt": "2026-09-02T10:00:00.000Z"
}
```

---

### PATCH /reports/:id

Update a report. **Requires authentication** (owner or admin only).

**Request:**
```json
{
  "title": "Updated title",
  "description": "Updated description"
}
```

**Response (200):** Updated report object.

---

### DELETE /reports/:id

Delete a report. **Requires authentication** (owner or admin only).

**Response (200):**
```json
{
  "message": "Report deleted successfully"
}
```

---

### GET /reports/nearby

Get reports near a location. **Requires authentication.**

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `lat` | number | Yes | Latitude |
| `lng` | number | Yes | Longitude |
| `radius` | number | Yes | Radius in kilometers |
| `eventType` | string | No | Filter by event type |

**Example:**
```
GET /reports/nearby?lat=28.6139&lng=77.2090&radius=50&eventType=flood
```

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Flood in South Delhi",
      "distance": 12.5,
      "latitude": 28.5500,
      "longitude": 77.2500
    }
  ]
}
```

---

## 3. Media (`/media`)

### POST /media/upload

Upload an image or video. **Requires authentication.**

**Request:**
```
Content-Type: multipart/form-data

file: <binary file data>
reportId: <report uuid>
type: "image" | "video"
```

**Response (201):**
```json
{
  "id": "media-uuid",
  "reportId": "report-uuid",
  "type": "image",
  "url": "https://res.cloudinary.com/...",
  "cloudinaryId": "reports/abc123",
  "createdAt": "2026-09-01T14:30:00.000Z"
}
```

**Constraints:**
- Max file size: 10MB
- Allowed types: jpg, jpeg, png, gif, mp4, webm

---

### DELETE /media/:id

Delete a media file. **Requires authentication** (owner or admin only).

**Response (200):**
```json
{
  "message": "Media deleted successfully"
}
```

---

## 4. Verification (`/verify`)

### POST /verify/:reportId

Verify or flag a report. **Requires admin role.**

**Request:**
```json
{
  "status": "verified",
  "notes": "Confirmed by local news reports"
}
```

**Status values:** `verified`, `unverified`, `suspicious`

**Response (201):**
```json
{
  "id": "ver-uuid",
  "reportId": "report-uuid",
  "status": "verified",
  "notes": "Confirmed by local news reports",
  "user": {
    "id": "admin-uuid",
    "name": "Admin User"
  },
  "createdAt": "2026-09-02T10:00:00.000Z"
}
```

**Side effects:**
- Updates `report.verificationStatus`
- If status=verified and credibility > threshold → creates Alert

---

### GET /verify/history/:reportId

Get verification history for a report. **Requires authentication.**

**Response (200):**
```json
[
  {
    "id": "ver-uuid",
    "status": "verified",
    "notes": "Confirmed by local news",
    "user": { "name": "Admin User" },
    "createdAt": "2026-09-02T10:00:00.000Z"
  },
  {
    "id": "ver-uuid-2",
    "status": "pending",
    "notes": null,
    "user": { "name": "System" },
    "createdAt": "2026-09-01T14:30:00.000Z"
  }
]
```

---

## 5. Alerts (`/alerts`)

### GET /alerts

Get paginated list of alerts. **Requires authentication.**

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page |
| `eventType` | string | — | Filter by event type |
| `severity` | string | — | Filter by severity |
| `isActive` | boolean | true | Filter by active status |

**Response (200):**
```json
{
  "data": [
    {
      "id": "alert-uuid",
      "title": "Flood Alert - South Delhi",
      "message": "Severe flooding reported in South Delhi area",
      "eventType": "flood",
      "severity": "critical",
      "isActive": true,
      "reportId": "report-uuid",
      "createdAt": "2026-09-02T10:00:00.000Z"
    }
  ],
  "total": 5,
  "page": 1,
  "limit": 20,
  "totalPages": 1
}
```

---

### GET /alerts/active

Get all active alerts (no pagination). **Requires authentication.**

**Response (200):**
```json
[
  {
    "id": "alert-uuid",
    "title": "Flood Alert",
    "severity": "critical",
    "eventType": "flood",
    "message": "Severe flooding...",
    "reportId": "report-uuid"
  }
]
```

---

### PATCH /alerts/:id/dismiss

Dismiss an alert. **Requires admin role.**

**Response (200):**
```json
{
  "id": "alert-uuid",
  "isActive": false,
  "message": "Alert dismissed"
}
```

---

## 6. Weather (`/weather`)

### GET /weather/current/:city

Get current weather for a city. **Requires authentication.**

**Response (200):**
```json
{
  "city": "Delhi",
  "temperature": 32.5,
  "humidity": 78,
  "description": "scattered clouds",
  "windSpeed": 5.2,
  "icon": "03d",
  "timestamp": "2026-09-01T14:30:00.000Z"
}
```

---

### GET /weather/forecast/:city

Get 5-day weather forecast. **Requires authentication.**

**Response (200):**
```json
{
  "city": "Delhi",
  "forecast": [
    {
      "date": "2026-09-01",
      "tempMin": 28.0,
      "tempMax": 35.0,
      "description": "light rain",
      "humidity": 80,
      "windSpeed": 6.1
    }
  ]
}
```

---

## 7. Classification (`/classify`)

### POST /classify

Classify weather event from text. **Requires authentication.**

**Request:**
```json
{
  "text": "Heavy rain in Delhi, streets are flooded with knee-deep water"
}
```

**Response (200):**
```json
{
  "eventType": "rainfall",
  "confidence": 0.92,
  "probabilities": {
    "rainfall": 0.92,
    "flood": 0.05,
    "thunderstorm": 0.02,
    "other": 0.01
  }
}
```

---

## 8. Credibility (`/credibility`)

### POST /credibility/analyze/:reportId

Analyze credibility of a report. **Requires authentication.**

**Response (200):**
```json
{
  "score": 75.5,
  "factors": {
    "textQuality": 20.0,
    "sourceReliability": 18.0,
    "hasMedia": 15.0,
    "locationProvided": 12.0,
    "textFormality": 10.5
  }
}
```

---

## 9. FastAPI ML Service Endpoints

These are internal endpoints called by the NestJS backend.

### POST http://localhost:8000/classify

**Request:**
```json
{
  "text": "Heavy rain in Delhi"
}
```

**Response:**
```json
{
  "event_type": "rainfall",
  "confidence": 0.92,
  "probabilities": {
    "rainfall": 0.92,
    "flood": 0.05,
    "thunderstorm": 0.02,
    "other": 0.01
  }
}
```

---

### POST http://localhost:8000/credibility

**Request:**
```json
{
  "text": "Detailed description of heavy rain...",
  "source": "citizen",
  "has_media": true,
  "location_valid": true
}
```

**Response:**
```json
{
  "score": 75.5,
  "factors": {
    "text_quality": 20.0,
    "source_reliability": 18.0,
    "has_media": 15.0,
    "location_valid": 12.0,
    "text_formality": 10.5
  }
}
```

---

### POST http://localhost:8000/duplicates

**Request:**
```json
{
  "text": "Heavy rain in Delhi",
  "existing_texts": [
    "Delhi receives heavy rainfall today",
    "Mumbai sees clear skies"
  ]
}
```

**Response:**
```json
{
  "is_duplicate": false,
  "similar_to_index": 0,
  "similarity_score": 0.72
}
```

---

### GET http://localhost:8000/health

**Response:**
```json
{
  "status": "healthy",
  "model_loaded": true,
  "version": "1.0.0"
}
```

---

## Error Response Format

All errors follow this format:

```json
{
  "statusCode": 400,
  "message": ["email must be an email", "password must be longer than 6 characters"],
  "error": "Bad Request"
}
```

## Rate Limiting (Future)

MVP does not implement rate limiting. Future versions should add:
- 100 requests/minute per user for read endpoints
- 10 requests/minute per user for write endpoints
- 5 requests/minute for file uploads
