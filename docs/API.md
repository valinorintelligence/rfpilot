# RFPilot API Documentation

Base URL: `/api/v1`

All endpoints (except `/auth/login` and `/auth/register`) require a JWT Bearer token in the Authorization header.

## Authentication

### POST /auth/login
```json
Request: { "email": "admin@rfpilot.local", "password": "changeme" }
Response: { "access_token": "...", "refresh_token": "...", "token_type": "bearer" }
```

### POST /auth/register
```json
Request: { "email": "...", "password": "...", "full_name": "...", "role": "engineer" }
Response: { "id": "uuid", "email": "...", "full_name": "...", "role": "..." }
```

### GET /auth/me
Returns current user profile.

## RFPs

### GET /rfps
Query params: `status`, `department`, `search`, `skip`, `limit`

### POST /rfps
```json
Request: { "title": "...", "client_name": "...", "department": "...", "estimated_value": 1000000 }
```

### POST /rfps/{id}/upload/rfp
Multipart form upload. Field: `file`

### POST /rfps/{id}/upload/capability
Multipart form upload. Field: `file`

### POST /rfps/{id}/analyze
Triggers Engine A AI extraction. Returns extraction result.

### POST /rfps/{id}/match
Triggers Engine B capability cross-match. Requires both RFP and capability documents.

### POST /rfps/{id}/generate
Generates Word proposal document. Requires prior analysis.

### GET /rfps/{id}/proposals/{pid}/download
Downloads generated .docx file.

## Analytics

### GET /analytics/overview
Returns total RFPs, win rate, pipeline value, etc.

### GET /analytics/quarterly
Returns quarterly win/loss breakdown.

### GET /analytics/gaps
Returns most common capability gaps.

## Settings

### GET /settings
Returns current app configuration.

### PUT /settings
Update company name and API key (admin only).

### POST /settings/logo
Upload company logo (admin only).

### POST /settings/template
Upload Word template (admin only).
