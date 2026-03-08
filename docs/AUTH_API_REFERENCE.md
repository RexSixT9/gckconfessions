# Authentication API Reference

## Endpoints

### 🔐 POST /api/admin/login
**Purpose**: Authenticate admin user and set secure cookie

**Request**:
```json
{
  "email": "admin@college.com",
  "password": "SecurePassword123"
}
```

**Response** (Success):
```json
{
  "ok": true,
  "message": "Login successful.",
  "redirectTo": "/admin"
}
```

**Cookie Set**:
```
gck_admin_token=<JWT_TOKEN>
HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=28800
```

**Status Codes**:
- `200` - Login successful
- `400` - Missing email/password
- `401` - Invalid credentials
- `403` - Arcjet blocked or invalid origin
- `415` - Invalid content type
- `429` - Too many login attempts
- `500` - Server error

---

### 🚪 POST /api/admin/logout
**Purpose**: Clear authentication cookie and log out admin

**Request**: No body required (form submission or fetch)

**Response**: Redirect to `/adminlogin`

**Cookie Cleared**:
```
gck_admin_token=
HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0
```

**Side Effects**:
- Creates `admin_logout` audit log entry
- Clears authentication cookie
- Redirects to login page

**Status Codes**:
- `302` - Redirect to /adminlogin (success)
- `403` - Arcjet blocked

---

## Cookie Details

### Name
`gck_admin_token`

### Properties
| Property | Value | Purpose |
|----------|-------|---------|
| httpOnly | true | Prevents JavaScript access (XSS protection) |
| secure | true (production) | HTTPS-only transmission |
| sameSite | strict | CSRF protection |
| path | / | Available across entire domain |
| maxAge | 28800 (8 hours) | Automatic expiration |

### Token Payload
```typescript
{
  sub: string;      // Admin user ID
  email: string;    // Admin email
  exp: number;      // Expiration timestamp (8 hours)
}
```

---

## Protected Routes

### Middleware Protected
All requests to these paths require valid `gck_admin_token` cookie:

1. **Admin Pages**: `/admin/*`
   - Unauthenticated → Redirect to `/adminlogin`

2. **Admin APIs**: `/api/admin/*`
   - Unauthenticated → `401 Unauthorized`

3. **Confession APIs**: `/api/confessions/*` (GET/PATCH only)
   - POST (submission) is public
   - Unauthenticated GET/PATCH → `401 Unauthorized`

### Unprotected Routes
- `/` - Home page
- `/submit` - Confession submission
- `/adminlogin` - Login page
- `/api/admin/login` - Login endpoint
- `/api/admin/setup` - Initial admin setup
- `POST /api/confessions` - Public confession submission

---

## Usage Examples

### Login (JavaScript)
```javascript
const response = await fetch('/api/admin/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@college.com',
    password: 'password'
  })
});

const data = await response.json();

if (data.ok) {
  window.location.href = data.redirectTo; // Redirect to /admin
}
```

### Logout (HTML Form)
```html
<form action="/api/admin/logout" method="POST">
  <button type="submit">Logout</button>
</form>
```

### Logout (JavaScript)
```javascript
await fetch('/api/admin/logout', {
  method: 'POST'
});

// Browser will automatically follow redirect to /adminlogin
```

### Check Authentication (Client-Side)
```javascript
// The cookie is httpOnly, so you can't check it from JavaScript
// Instead, just try to access protected resources

const response = await fetch('/api/confessions?status=pending');

if (response.status === 401) {
  window.location.href = '/adminlogin';
}
```

### Check Authentication (Server-Side)
```typescript
import { cookies } from 'next/headers';
import { verifyAdminToken } from '@/lib/auth';
import { COOKIE_NAME } from '@/lib/constants';

const cookieStore = await cookies();
const token = cookieStore.get(COOKIE_NAME)?.value;

if (!token) {
  redirect('/adminlogin');
}

try {
  const payload = await verifyAdminToken(token);
  // User is authenticated
  console.log('Admin:', payload.email);
} catch {
  redirect('/adminlogin');
}
```

---

## Security Considerations

### ✅ CSRF Protection
- `sameSite: strict` prevents cross-site cookie transmission
- Origin validation in login endpoint
- No need for CSRF tokens

### ✅ XSS Protection
- `httpOnly: true` prevents JavaScript access
- Tokens cannot be stolen via XSS attacks

### ✅ Token Theft Protection
- Short expiration (8 hours)
- Secure transmission (HTTPS in production)
- No token in URL or localStorage

### ✅ Replay Attack Protection
- Tokens expire after 8 hours
- Logout immediately invalidates token

### ⚠️ Rate Limiting
Login endpoint has built-in rate limiting:
- Max attempts per IP tracked
- Automatic blocking after threshold
- Logs suspicious activity

---

## Troubleshooting

### Issue: Cookie not being set
**Check**:
1. HTTPS in production (secure flag requires it)
2. Same domain (no cross-domain requests)
3. Browser allows cookies
4. Content-Type: application/json in login request

### Issue: Logged out immediately after login
**Check**:
1. JWT_SECRET environment variable is set
2. Token expiration hasn't passed
3. No middleware errors (check server logs)
4. Cookie domain/path settings

### Issue: 401 Unauthorized on protected routes
**Check**:
1. Login was successful (check Network tab)
2. Cookie is present (check Application tab)
3. Token is valid (not expired)
4. JWT_SECRET matches between login and verification

### Issue: Logout doesn't redirect
**Check**:
1. POST method (not GET)
2. Correct endpoint URL
3. Browser allows redirects
4. Check browser console for errors

---

## Audit Logging

All authentication events are logged to MongoDB `auditlogs` collection:

### Login Event
```json
{
  "action": "admin_login",
  "adminEmail": "admin@college.com",
  "ip": "192.168.1.1",
  "createdAt": "2026-02-12T10:30:00.000Z"
}
```

### Logout Event
```json
{
  "action": "admin_logout",
  "adminEmail": "admin@college.com",
  "ip": "192.168.1.1",
  "createdAt": "2026-02-12T12:45:00.000Z"
}
```

### Query Examples
```javascript
// Recent logins
db.auditlogs.find({ action: "admin_login" })
  .sort({ createdAt: -1 })
  .limit(10);

// Failed login attempts (check application logs)
// Successful logins only appear in audit log

// Logout history for specific admin
db.auditlogs.find({ 
  action: "admin_logout",
  adminEmail: "admin@college.com"
}).sort({ createdAt: -1 });
```

---

**Last Updated**: February 12, 2026  
**Version**: 1.0.0  
**Status**: Production Ready ✅
