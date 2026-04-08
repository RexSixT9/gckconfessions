# Admin Management API Reference

Complete reference for managing admin accounts — initial setup, listing, creating, and deleting admins.

---

## Endpoints Overview

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/api/admin/setup` | Setup Key | Create an admin account |
| GET | `/api/admin/admins` | Cookie | List all admin accounts |
| POST | `/api/admin/admins` | Setup Key | Create a new admin account |
| DELETE | `/api/admin/admins/[id]` | Cookie | Delete an admin account |
| GET | `/api/admin/audit/webhook-health` | Cookie | Delivery health for Discord/email webhooks |
| GET | `/api/internal/discord-metrics` | Secret Header | Internal machine metrics for Discord bot |

---

## GET /api/admin/audit/webhook-health

Purpose: Returns a compact operational snapshot for webhook channels used by audit/security alert delivery.

### Request

```http
GET /api/admin/audit/webhook-health?hours=24
Cookie: gck_admin_token=<JWT>
```

Query params:

- `hours` (optional): window size between `1` and `168` hours. Default: `24`.

### Response (Success - 200)

```json
{
  "generatedAt": "2026-04-07T12:30:45.120Z",
  "windowHours": 24,
  "overallStatus": "healthy",
  "channels": {
    "audit_discord": {
      "attempts": 120,
      "successes": 118,
      "failures": 2,
      "successRate": 0.9833,
      "status": "healthy",
      "lastDeliveredAt": "2026-04-07T12:30:01.010Z",
      "lastFailedAt": "2026-04-07T09:10:20.010Z",
      "latencyMs": { "p50": 45, "p95": 160, "max": 340, "samples": 110 }
    }
  },
  "recentFailures": []
}
```

Status logic:

- `healthy`: all recent attempts succeeded, or failures are below threshold.
- `degraded`: failure rate is above threshold in the selected window.
- `down`: attempts exist but no success in the selected window.
- `unknown`: no attempts in the selected window.

### Status Codes

| Code | Reason |
|------|--------|
| `200` | Success |
| `401` | Missing or invalid auth cookie |
| `429` | Read rate limit exceeded |
| `500` | Server error |

---

## GET /api/internal/discord-metrics

Purpose: Internal machine-to-machine metrics endpoint for the standalone Discord ops bot.

### Request

```http
GET /api/internal/discord-metrics?days=7&webhookHours=24
x-discord-metrics-secret: <DISCORD_METRICS_SECRET>
```

Query params:

- `days` (optional): daily series window between `1` and `90`. Default: `7`.
- `webhookHours` (optional): webhook health window between `1` and `168`. Default: `24`.

### Response (Success - 200)

```json
{
  "schemaVersion": 1,
  "generatedAt": "2026-04-08T10:00:00.000Z",
  "health": {
    "overallStatus": "healthy",
    "api": {
      "status": "ok",
      "timestamp": "2026-04-08T10:00:00.000Z",
      "uptimeSeconds": 45812,
      "environment": "production",
      "version": "1.0.0"
    },
    "database": { "status": "up" },
    "issues": []
  },
  "windows": { "days": 7, "webhookHours": 24 },
  "queue": {
    "pending": 12,
    "approved": 210,
    "rejected": 43,
    "published": 180,
    "total": 265
  },
  "daily": [
    {
      "day": "2026-04-08",
      "submissions": 16,
      "pending": 6,
      "approved": 8,
      "rejected": 2,
      "published": 5
    }
  ],
  "webhookHealth": {
    "windowHours": 24,
    "overallStatus": "healthy",
    "channels": {
      "audit_discord": {
        "attempts": 120,
        "successes": 118,
        "failures": 2,
        "successRate": 0.9833,
        "status": "healthy",
        "lastDeliveredAt": "2026-04-08T09:58:20.000Z",
        "lastFailedAt": "2026-04-08T08:12:01.000Z"
      }
    }
  }
}
```

### Status Codes

| Code | Reason |
|------|--------|
| `200` | Success |
| `400` | Invalid query params |
| `401` | Missing/invalid metrics secret |
| `429` | Internal bot read rate limit exceeded |
| `503` | `DISCORD_METRICS_SECRET` is not configured |
| `500` | Server error |

---

## 🔧 POST /api/admin/setup

**Purpose**: Create an admin account. Rejects duplicate emails but allows multiple admins.

### Request

```http
POST /api/admin/setup
Content-Type: application/json
```

```json
{
  "email": "admin@college.com",
  "password": "MyStr0ng!Pass#1",
  "setupKey": "<ADMIN_SETUP_KEY from .env>"
}
```

### Validation Rules

| Field | Rule |
|-------|------|
| `email` | Required, valid email format, lowercased & trimmed |
| `password` | Required, min 12 chars, must include uppercase, lowercase, number, and symbol |
| `setupKey` | Required, must match the `ADMIN_SETUP_KEY` environment variable exactly |

### Response (Success — 201)

```json
{
  "ok": true
}
```

### Status Codes

| Code | Reason |
|------|--------|
| `201` | Admin created successfully |
| `400` | Missing fields or invalid email/password |
| `401` | Invalid setup key or IP is blocked |
| `403` | Arcjet blocked or invalid origin |
| `409` | An admin with that email already exists |
| `415` | Content-Type is not `application/json` |
| `429` | Too many setup attempts (3 per 30 min in production) |
| `500` | `ADMIN_SETUP_KEY` not configured or server error |

### Security

- **Origin check**: Request must come from the same origin.
- **Blocked IPs**: IPs listed in the `BLOCKED_IPS` env var are rejected.
- **Duplicate check**: Rejects if an admin with the same email already exists.

---

## 📋 GET /api/admin/admins

**Purpose**: List all admin accounts. Password hashes are **never** returned.

### Request

```http
GET /api/admin/admins
Cookie: gck_admin_token=<JWT>
```

No request body.

### Response (Success — 200)

```json
{
  "admins": [
    {
      "_id": "664a1b2c3d4e5f6a7b8c9d0e",
      "email": "admin@college.com",
      "createdAt": "2026-01-15T08:30:00.000Z",
      "isSelf": true
    },
    {
      "_id": "664a1b2c3d4e5f6a7b8c9d0f",
      "email": "moderator@college.com",
      "createdAt": "2026-02-01T14:20:00.000Z",
      "isSelf": false
    }
  ]
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `_id` | `string` | MongoDB ObjectId of the admin |
| `email` | `string` | Admin email address |
| `createdAt` | `string \| null` | ISO 8601 creation timestamp |
| `isSelf` | `boolean` | `true` if this entry is the currently authenticated admin |

### Status Codes

| Code | Reason |
|------|--------|
| `200` | Success |
| `401` | Missing or invalid auth cookie |
| `500` | Server error |

---

## ➕ POST /api/admin/admins

**Purpose**: Create a new admin account. Authenticated via `ADMIN_SETUP_KEY` (same method as setup).

### Request

```http
POST /api/admin/admins
Content-Type: application/json
```

```json
{
  "email": "newadmin@college.com",
  "password": "An0ther$ecure!Pass",
  "setupKey": "<ADMIN_SETUP_KEY from .env>"
}
```

### Validation Rules

| Field | Rule |
|-------|------|
| `email` | Required, valid email, max 254 chars (RFC 5321), lowercased & trimmed |
| `password` | Required, min 12 chars, must include uppercase, lowercase, number, and symbol. Whitespace is preserved (not trimmed). |
| `setupKey` | Required, must match the `ADMIN_SETUP_KEY` environment variable exactly |

### Response (Success — 201)

```json
{
  "admin": {
    "_id": "664a1b2c3d4e5f6a7b8c9d10",
    "email": "newadmin@college.com",
    "createdAt": "2026-02-21T10:15:00.000Z"
  }
}
```

### Status Codes

| Code | Reason |
|------|--------|
| `201` | Admin created successfully |
| `400` | Missing or invalid email/password/setupKey |
| `401` | Invalid setup key or IP is blocked |
| `403` | Arcjet blocked or invalid origin |
| `409` | Admin with that email already exists |
| `415` | Content-Type is not `application/json` |
| `429` | Rate limit exceeded (3 per 30 min in production) |
| `500` | `ADMIN_SETUP_KEY` not configured or server error |

### Audit Log

On success, an `admin_created` audit entry is recorded:

```json
{
  "action": "admin_created",
  "adminEmail": "admin@college.com",
  "ip": "192.168.1.1",
  "meta": {
    "createdEmail": "newadmin@college.com"
  }
}
```

---

## 🗑️ DELETE /api/admin/admins/[id]

**Purpose**: Permanently delete an admin account.

### Request

```http
DELETE /api/admin/admins/664a1b2c3d4e5f6a7b8c9d10
Cookie: gck_admin_token=<JWT>
```

No request body.

### Constraints

| Rule | Description |
|------|-------------|
| **No self-deletion** | An admin cannot delete their own account (prevents accidental lockout) |
| **No last-admin deletion** | The last remaining admin cannot be deleted (prevents total lockout) |
| **Valid ObjectId** | The `id` parameter must be a valid MongoDB ObjectId |

### Response (Success — 200)

```json
{
  "ok": true
}
```

### Status Codes

| Code | Reason |
|------|--------|
| `200` | Admin deleted successfully |
| `400` | Invalid admin ID format |
| `401` | Missing or invalid auth cookie |
| `403` | Arcjet blocked, or attempting to delete own account |
| `404` | Admin not found |
| `409` | Cannot delete the last admin account |
| `429` | Rate limit exceeded (10 actions per 10 min in production) |
| `500` | Server error |

### Audit Log

On success, an `admin_deleted` audit entry is recorded:

```json
{
  "action": "admin_deleted",
  "adminEmail": "admin@college.com",
  "ip": "192.168.1.1",
  "meta": {
    "deletedId": "664a1b2c3d4e5f6a7b8c9d10",
    "deletedEmail": "newadmin@college.com"
  }
}
```

---

## Password Policy

All admin passwords must satisfy **every** condition:

| Requirement | Detail |
|-------------|--------|
| Minimum length | 12 characters |
| Maximum length | 128 characters |
| Uppercase letter | At least one (`A-Z`) |
| Lowercase letter | At least one (`a-z`) |
| Digit | At least one (`0-9`) |
| Symbol | At least one special character |

Passwords are hashed with **bcrypt** (10 rounds) before storage. Raw passwords are never persisted.

---

## Rate Limiting

### Admin Creation (Setup + Add Admin)

Both `POST /api/admin/setup` and `POST /api/admin/admins` share the same strict rate limiter:

| Environment | Max Requests | Window | Block Duration |
|-------------|-------------|--------|----------------|
| Production | 3 | 30 minutes | 60 minutes |
| Development | 10 | 60 minutes | None |

### Admin Deletion

| Environment | Max Requests | Window | Block Duration |
|-------------|-------------|--------|----------------|
| Production | 10 | 10 minutes | 5 minutes |
| Development | 50 | 10 minutes | None |

Rate-limited responses include a `Retry-After` header (seconds).

> **Note**: Rate limiting uses in-memory storage (`RateLimiterMemory`). In serverless environments (e.g. Vercel), each function instance has its own state. For shared rate limiting across instances, replace with `RateLimiterRedis` or `RateLimiterMongo`.

---

## Data Model

### Admin Schema

```typescript
{
  email:        String   // unique, lowercase, required
  passwordHash: String   // bcrypt hash, required
  createdAt:    Date     // auto-generated (timestamps: true)
  updatedAt:    Date     // auto-generated (timestamps: true)
}
```

### Audit Log Schema

```typescript
{
  action:       String              // "admin_created" | "admin_deleted" | ...
  adminEmail:   String              // email of the admin who performed the action
  ip:           String              // client IP address
  meta:         Object              // action-specific details
  createdAt:    Date                // auto-generated
}
```

Audit logs are automatically deleted after **90 days** via a TTL index.

---

## Usage Examples

### Initial Setup (First Admin)

```javascript
const res = await fetch('/api/admin/setup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@college.com',
    password: 'MyStr0ng!Pass#1',
    setupKey: process.env.ADMIN_SETUP_KEY
  })
});

if (res.status === 201) {
  console.log('First admin created — proceed to login');
}
```

### List All Admins

```javascript
const res = await fetch('/api/admin/admins', {
  credentials: 'include' // sends the auth cookie
});

const { admins } = await res.json();
admins.forEach(a => {
  console.log(a.email, a.isSelf ? '(you)' : '');
});
```

### Add a New Admin

```javascript
const res = await fetch('/api/admin/admins', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'newmod@college.com',
    password: 'Str0ngP@ssw0rd!',
    setupKey: '<ADMIN_SETUP_KEY>'
  })
});

const data = await res.json();

if (res.status === 201) {
  console.log('Created:', data.admin.email);
} else {
  console.error(data.error);
}
```

### Delete an Admin

```javascript
const adminId = '664a1b2c3d4e5f6a7b8c9d10';

const res = await fetch(`/api/admin/admins/${adminId}`, {
  method: 'DELETE',
  credentials: 'include'
});

if (res.ok) {
  console.log('Admin removed');
} else {
  const { error } = await res.json();
  console.error(error);
  // Possible: "You cannot delete your own account."
  // Possible: "Cannot delete the last admin account."
}
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ADMIN_SETUP_KEY` | Yes (for setup) | Secret key for the one-time initial admin creation |
| `JWT_SECRET` | Yes | Secret used for signing/verifying admin auth tokens |
| `BLOCKED_IPS` | No | Comma-separated list of blocked IP addresses |
| `DEV_IP_OVERRIDE` | No | Override client IP in development for rate-limit testing |
| `MONGODB_URI` | Yes | MongoDB connection string |

---

## Troubleshooting

### "Admin already exists" on setup
The setup endpoint rejects duplicate emails. Use a different email or check existing admins with `GET /api/admin/admins`.

### "You cannot delete your own account"
Admins cannot delete themselves. Another admin must perform the deletion.

### "Cannot delete the last admin account"
At least one admin must remain at all times. Create a replacement admin before deleting.

### 429 Too Many Requests
Wait for the duration specified in the `Retry-After` response header. In production, admin actions are blocked for 5 minutes after exceeding 10 requests in a 10-minute window.

### Password rejected
Ensure the password meets all policy requirements: 12+ characters with uppercase, lowercase, digit, and symbol.

---

**Last Updated**: February 21, 2026
**Version**: 1.0.0
**Status**: Production Ready
