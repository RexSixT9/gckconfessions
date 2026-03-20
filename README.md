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
- Incident handling and dependency review runbooks:
	- `docs/INCIDENT_RESPONSE_RUNBOOK.md`
	- `docs/SECURITY_DEPENDENCY_REVIEW.md`
