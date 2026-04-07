# GCK Confessions

Anonymous confession submission site for a college Instagram team. Students can submit messages without login, and admins can review them before posting. The UI uses a clean, rounded-card theme with a soft yellow accent.

## Pages

- Home: overview and CTA
- Submit: confession form (anonymous)
- Admin: review list (UI mock)

## Run locally

```bash
npm run dev
```

Then open http://localhost:3000.

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

## Performance checks

Lighthouse CI tooling was removed from this repo. Run Lighthouse manually from browser DevTools or your CI environment if you still want performance audits.

## Security operations

- Dependency automation is configured via `.github/dependabot.yml`.
- CI runs `npm audit --audit-level=high` and dependency review checks.
- CSP rollout starts in report-only mode by default. Set `CSP_ENFORCE=true` to enforce CSP.
- Arcjet-only mode is the default. Keep `ENABLE_REDIS_RATE_LIMITS` unset (or set to `false`) for Vercel simplicity.
- Optional: set `ENABLE_REDIS_RATE_LIMITS=true` and `REDIS_URL` together to enable shared cross-instance rate limiting in production.
- Optional: set `ALLOWED_ORIGINS` (comma-separated) to explicitly allow trusted origins for mutation requests.
- Optional: set `ADMIN_IP_ALLOWLIST` (comma-separated exact IPs) to limit admin pages and admin APIs to trusted network addresses.
- Optional: set `REFERRER_POLICY` and `PERMISSIONS_POLICY` if you need stricter or custom browser security header policy values.
- Optional: tune webhook reliability for production runtimes:
	- `AUDIT_WEBHOOK_SYNC_ACTIONS` (comma-separated actions that should block briefly for near real-time webhook delivery)
	- `AUDIT_WEBHOOK_SYNC_BUDGET_MS` (max wait budget for sync audit webhook actions, default `2500`)
	- `SECURITY_ALERT_SYNC_BUDGET_MS` (max wait budget for security alert deliveries, default `4500`)
- Incident handling and dependency review runbooks:
	- `docs/INCIDENT_RESPONSE_RUNBOOK.md`
	- `docs/SECURITY_DEPENDENCY_REVIEW.md`
