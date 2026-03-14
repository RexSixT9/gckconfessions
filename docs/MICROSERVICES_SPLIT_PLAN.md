# Microservices Split Plan: Public Submit App + Admin Moderation App

## Goal

Reduce attack surface by separating anonymous public traffic from moderation and admin-management traffic.

## Recommended Target Topology

1. Public app (`gck-public`)
- Internet-facing domain: `confess.example.com`
- Pages: landing + submit only
- API responsibility: accept new confessions only

2. Admin app (`gck-admin`)
- Restricted domain: `admin.example.com`
- Access boundary: Zero Trust (Cloudflare Access / Tailscale / IP allowlist) + MFA
- Pages: login, review, moderation actions, admin management, audit visibility
- API responsibility: all moderation and admin-management endpoints

3. Shared data plane
- Same MongoDB cluster initially (phase 1), but different DB users and permissions
- Optional queue/event bus in phase 2 for submit-to-moderation decoupling

## Exact Route Split (from current codebase)

### Keep in Public App

Current public pages and APIs to keep:

| Current Route | Method | Keep? | Notes |
|---|---|---|---|
| `/` | GET | Yes | Landing page |
| `/submit` | GET | Yes | Submission page |
| `/api/confessions` | POST | Yes | Anonymous submission only |
| `/api/health` | GET | Yes | Public service health |
| `/api/security/csp-report` | POST | Yes | CSP telemetry for public app |

### Remove from Public App

Remove all admin and moderation routes from the public deployment:

| Current Route | Method | Action |
|---|---|---|
| `/admin` and `/admin/*` | GET | Remove |
| `/adminlogin` | GET | Remove |
| `/api/admin/login` | POST | Remove |
| `/api/admin/logout` | POST | Remove |
| `/api/admin/check` | GET | Remove |
| `/api/admin/setup` | POST | Remove |
| `/api/admin/stats` | GET | Remove |
| `/api/admin/admins` | GET, POST | Remove |
| `/api/admin/admins/[id]` | DELETE | Remove |
| `/api/confessions` | GET | Remove |
| `/api/confessions/[id]` | PATCH, DELETE | Remove |

### Move to Admin App

Two options are valid. Option A keeps existing route shape for easier migration. Option B renames moderation APIs for clearer boundary.

Option A (fast migration):

| Admin App Route | Method | Source |
|---|---|---|
| `/api/admin/login` | POST | existing |
| `/api/admin/logout` | POST | existing |
| `/api/admin/check` | GET | existing |
| `/api/admin/setup` | POST | existing (temporary, phase out later) |
| `/api/admin/stats` | GET | existing |
| `/api/admin/admins` | GET, POST | existing |
| `/api/admin/admins/[id]` | DELETE | existing |
| `/api/confessions` | GET | existing |
| `/api/confessions/[id]` | PATCH, DELETE | existing |

Option B (cleaner long-term):

| New Admin App Route | Method | Old Route |
|---|---|---|
| `/api/auth/login` | POST | `/api/admin/login` |
| `/api/auth/logout` | POST | `/api/admin/logout` |
| `/api/auth/check` | GET | `/api/admin/check` |
| `/api/moderation/confessions` | GET | `/api/confessions` (GET only) |
| `/api/moderation/confessions/[id]` | PATCH, DELETE | `/api/confessions/[id]` |
| `/api/admins` | GET, POST | `/api/admin/admins` |
| `/api/admins/[id]` | DELETE | `/api/admin/admins/[id]` |
| `/api/moderation/stats` | GET | `/api/admin/stats` |

## Admin Dashboard IA (tabs and features)

Create dedicated pages in admin app:

1. `Review` tab
- Pending queue
- Search and filter (`pending`, `approved`, `rejected`, `posted`)
- Actions: approve/reject/post/unpost/delete

2. `Confessions` tab
- Full history table
- Bulk actions (optional)

3. `Admins` tab
- List admins
- Add admin
- Delete admin (with no-self-delete and no-last-admin guard)

4. `Audit` tab
- Show admin actions, security alerts, login failures

5. `Settings` tab
- Maintenance toggle
- Retention policy trigger

## Authentication and Access Model (recommended)

Phase 1 (minimal change):
- Keep current cookie session model but only in admin app domain
- Keep JWT cookie `HttpOnly`, `Secure`, `SameSite=Strict`
- Restrict admin app at edge (Zero Trust policy)

Phase 2 (stronger):
- Replace password login + setup key flow with SSO/OIDC + MFA
- Replace `ADMIN_SETUP_KEY` provisioning with invite-based admin onboarding

## MongoDB Least-Privilege Permission Matrix

Use separate DB users and secrets per service.

| Service User | `confessions` | `deletedconfessions` | `admins` | `auditlogs` | Purpose |
|---|---|---|---|---|---|
| `public_ingest_user` | `insert` only | none | none | optional `insert` only | Accept anonymous submissions |
| `admin_dashboard_user` | `find`, `update`, `delete` | `insert`, `find` | `find`, `insert`, `delete`, `update` | `insert`, `find` | Moderation and admin management |
| `reporting_user` (optional) | `find` (approved only via app policy) | none | none | `find` | Transparency/reporting endpoints |

Critical rule: public service credentials must not be able to read or mutate admin tables.

## Network and Edge Controls

1. Public app
- WAF + strict rate limits on submit endpoint
- CAPTCHA/human challenge on risk signals

2. Admin app
- Zero Trust gate before app
- Optional IP allowlist
- Lower per-user action limits and anomaly alerting

3. APIs
- Different API origins and different cookies for public/admin apps
- No shared wildcard CORS

## Migration Plan (low risk)

1. Create new `gck-admin` app and move current admin pages/components.
2. Move moderation handlers (`GET /api/confessions`, `PATCH/DELETE /api/confessions/[id]`) into admin app.
3. Move all `/api/admin/*` handlers into admin app.
4. Keep only `POST /api/confessions` in public app.
5. Remove admin routes/pages from public app and simplify proxy/middleware to public needs only.
6. Rotate all secrets and create dedicated Mongo users (`public_ingest_user`, `admin_dashboard_user`).
7. Add edge access control to admin domain.
8. Decommission `ADMIN_SETUP_KEY` flow after invite/SSO onboarding is live.

## Monorepo vs Multi-repo

Recommended: monorepo with two deployable apps.

- `apps/public` (landing + submit)
- `apps/admin` (moderation dashboard)
- `packages/shared` (types, validation, common UI primitives if needed)

This gives strong deployment isolation without doubling maintenance overhead.

## Immediate Security Wins You Can Do First

1. Remove all admin pages and `/api/admin/*` routes from the public deployment.
2. Ensure public app exposes only `POST /api/confessions` (plus non-sensitive health routes).
3. Create separate Mongo credentials per service and rotate existing secrets.
4. Put admin app behind Zero Trust + MFA.
