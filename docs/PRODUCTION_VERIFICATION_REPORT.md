# Production Verification Report

Date: 2026-03-14

Scope requested:
1. Admin setup endpoint blocked in production by default
2. Admin login/session/idle-timeout flow on admin.gckconfessions.com
3. Public submission flow and rate limiting on confess.gckconfessions.com
4. Response headers present on both apps

## Result Summary

- Code-path verification: PASS for all four items.
- Live-runtime verification from this automation environment: BLOCKED (external fetch and terminal HTTP execution are not returning reliable artifacts here).

## 1) Admin setup endpoint blocked by default in production

Status: PASS (code-verified)

Evidence:
- [apps/admin/src/proxy.ts](apps/admin/src/proxy.ts): production middleware returns 404 for /api/admin/setup when ADMIN_SETUP_ENABLED is not true.
- [apps/admin/src/app/api/admin/setup/route.ts](apps/admin/src/app/api/admin/setup/route.ts): route handler also returns 404 in production unless ADMIN_SETUP_ENABLED is true.
- [.env.example](.env.example): ADMIN_SETUP_ENABLED defaults documented for hardened production.

## 2) Admin login/session/idle-timeout flow

Status: PASS (code-verified)

Evidence:
- [apps/admin/src/app/api/admin/login/route.ts](apps/admin/src/app/api/admin/login/route.ts): login validates origin/content-type, applies rate limits, verifies credentials, sets auth/session cookies, rotates CSRF.
- [apps/admin/lib/session.ts](apps/admin/lib/session.ts): idle-timeout calculation and cookie rotation/clearing.
- [apps/admin/src/proxy.ts](apps/admin/src/proxy.ts): protected routes require token, redirect to /adminlogin when missing/invalid, clear cookies on idle expiry.

## 3) Public submission flow and rate limiting

Status: PASS (code-verified)

Evidence:
- [apps/public/src/app/api/confessions/route.ts](apps/public/src/app/api/confessions/route.ts): same-origin check, content-type validation, Arcjet decision, bot detection, validation/sanitization, duplicate detection, structured responses.
- [apps/public/lib/rateLimit.ts](apps/public/lib/rateLimit.ts): production submit and burst limits with Retry-After and X-RateLimit headers.

## 4) Response headers on both apps

Status: PASS (code-verified)

Evidence:
- [apps/admin/next.config.ts](apps/admin/next.config.ts): security headers including CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, HSTS, no-index tag.
- [apps/public/next.config.ts](apps/public/next.config.ts): security headers plus CSP report-only/enforce switch.

## Live Runtime Spot-Check Commands (run from your machine)

PowerShell quick checks:

1. Admin setup should be blocked in production:
   Invoke-WebRequest -Uri https://admin.gckconfessions.com/api/admin/setup -Method GET -SkipHttpErrorCheck

2. Admin protected route should redirect or reject when unauthenticated:
   Invoke-WebRequest -Uri https://admin.gckconfessions.com/admin -Method GET -MaximumRedirection 0 -SkipHttpErrorCheck

3. Public API should enforce method and rate-limit behavior:
   Invoke-WebRequest -Uri https://confess.gckconfessions.com/api/confessions -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"message":"probe","music":"","website":""}' -SkipHttpErrorCheck

4. Security headers sample:
   $r = Invoke-WebRequest -Uri https://admin.gckconfessions.com/adminlogin -Method GET -SkipHttpErrorCheck; $r.Headers
   $p = Invoke-WebRequest -Uri https://confess.gckconfessions.com/submit -Method GET -SkipHttpErrorCheck; $p.Headers

Expected indicators:
- admin setup: 404 when ADMIN_SETUP_ENABLED is false
- admin route unauthenticated: redirect to /adminlogin or 401 for API
- public submit under burst/repeat abuse: 429 with Retry-After and rate-limit headers
- headers include CSP/CSP-RO, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, HSTS
