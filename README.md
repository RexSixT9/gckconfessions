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

## Discord realtime ops bot

This repository now includes a standalone bot service at `apps/discord-bot` for txAdmin-style live status in Discord.

What it provides:

- One pinned status message that updates on an interval.
- Slash commands: `/status`, `/queue`, `/graph`, `/webhook-health`.
- Metrics source: `GET /api/internal/discord-metrics` (secret-header protected).

Quick start:

```bash
npm run bot:install
npm run bot:dev
```

The bot service has its own env template: `apps/discord-bot/.env.example`.

Detailed setup and Discord role/permission walkthrough:

- `docs/DISCORD_BOT_INTEGRATION.md`

### Internal metrics endpoint for bot

- Route: `GET /api/internal/discord-metrics`
- Header required: `x-discord-metrics-secret: <DISCORD_METRICS_SECRET>`
- Query params:
	- `days` (default `7`, range `1..90`)
	- `webhookHours` (default `24`, range `1..168`)

Returns:

- API health snapshot
- Queue totals (pending/approved/rejected/published/total)
- Daily confession series for graphing
- Webhook delivery health summary by channel

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
