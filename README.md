# GCK Confessions

Anonymous confession submission site for a college Instagram team. Students can submit messages without login, and admins can review them before posting. The UI uses a clean, rounded-card theme with a soft yellow accent.

## Split App Structure (Phase 1)

This repository now includes a service split scaffold:

- `apps/public`: public-facing app (landing + submit)
- `apps/admin`: moderation dashboard app (admin login + review + admin management)

The original root app remains available during migration for fallback.

Modular structure reference:

- `docs/MODULAR_STRUCTURE.md`

## Split App Health Checks

Run full split verification from repository root:

```bash
npm run check:split
```

This runs:

- `apps/public` lint + typecheck + build
- `apps/admin` lint + typecheck + build

## Pages

- Home: overview and CTA
- Submit: confession form (anonymous)
- Admin: review list (UI mock)

## Run locally

```bash
npm run dev
```

Then open http://localhost:3000.

### Run split apps locally

```bash
npm run dev:public
npm run dev:admin
```

- Public app: http://localhost:3001
- Admin app: http://localhost:3002

You can also run each app directly:

```bash
npm --prefix apps/public run dev
npm --prefix apps/admin run dev
```

## Quality checks

```bash
npm run lint
npm run typecheck
npm run build
```

## Smoke tests (Playwright)

```bash
npm run test:e2e
```

## Performance assertions (Lighthouse CI)

```bash
npm run perf:assert
```

The Lighthouse assertions currently enforce thresholds for LCP, CLS, and TBT in `lighthouserc.json`.

## Security operations

- Dependency automation is configured via `.github/dependabot.yml`.
- CI runs `npm audit --audit-level=high` and dependency review checks.
- CSP rollout starts in report-only mode by default. Set `CSP_ENFORCE=true` to enforce CSP.
- Incident handling and dependency review runbooks:
	- `docs/INCIDENT_RESPONSE_RUNBOOK.md`
	- `docs/SECURITY_DEPENDENCY_REVIEW.md`

## Vercel Deployment (Recommended)

Use two Vercel projects from the same repository:

1. `gck-public`
- Root Directory: `apps/public`
- Framework Preset: Next.js
- Production domain: public site

2. `gck-admin`
- Root Directory: `apps/admin`
- Framework Preset: Next.js
- Production domain: admin site (protect at edge with Zero Trust/IP allowlist)

Environment setup:

- Configure env vars per project (do not share admin-only secrets with public app).
- Use Vercel env scopes correctly: Development, Preview, Production.
- Start from `.env.example` and split values by service responsibility.

## Production Hardening Checklist (Domain-Tailored)

Target domains:

- Public app: `confess.gckconfessions.com`
- Admin app: `admin.gckconfessions.com`

Apply these settings before production cutover:

1. DNS and TLS
- Create DNS records so `confess.gckconfessions.com` points to `gck-public`.
- Create DNS records so `admin.gckconfessions.com` points to `gck-admin`.
- Enforce HTTPS on both projects in Vercel.

2. Admin edge restrictions
- Set `ADMIN_ALLOWED_HOSTS=admin.gckconfessions.com` on `gck-admin`.
- Set `ADMIN_SETUP_ENABLED=false` on `gck-admin`.
- Optionally set `ADMIN_ALLOWED_IPS` with your office/VPN egress IPs.
- Add external Zero Trust access in front of `admin.gckconfessions.com` (Cloudflare Access / equivalent).

3. Cookie and session safety
- Set `ADMIN_COOKIE_DOMAIN=admin.gckconfessions.com` (or keep empty to use exact host scoping).
- Ensure `NODE_ENV=production` so secure cookie flags are active.
- Rotate `JWT_SECRET` and `ADMIN_SETUP_KEY` before go-live.

4. Security headers and CSP
- Keep CSP in report mode initially on public app (`CSP_ENFORCE=false`).
- Monitor CSP reports via `/api/security/csp-report`.
- Switch to enforce mode after report noise is resolved (`CSP_ENFORCE=true`).
- Admin app ships with `X-Robots-Tag: noindex, nofollow` defaults.

5. Vercel env scoping
- Add all secrets in Production scope for each project separately.
- Mirror only non-sensitive values to Preview/Development as needed.
- Never copy admin-only secrets (e.g., `JWT_SECRET`, `ADMIN_SETUP_KEY`) into public project envs.

6. Final verification
- Run `npm run check:split` before deployment.
- Validate login/logout/session idle behavior at `admin.gckconfessions.com`.
- Validate public submission flow and rate limiting at `confess.gckconfessions.com`.
