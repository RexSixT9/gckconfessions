# Incident Response Runbook

## Scope
This runbook covers abuse spikes, account compromise risk, and potential data exposure events.

## Severity Levels
- SEV-1: Confirmed data exposure, admin compromise, or active destructive abuse.
- SEV-2: Sustained attack traffic, repeated failed admin login spikes, moderation workflow disruption.
- SEV-3: Isolated suspicious activity with no confirmed impact.

## Immediate Triage (first 15 minutes)
1. Declare incident severity and assign incident commander.
2. Freeze risky admin actions if needed by enabling maintenance mode.
3. Capture timeline start, affected routes, and first known indicators.
4. Verify whether alert came from:
   - `security_alert` audit events
   - Rate limit saturation
   - Failed login spikes

## Containment
1. Rotate `JWT_SECRET` and `AUDIT_LOG_ENCRYPTION_KEY` for confirmed auth compromise.
2. Invalidate active sessions by restarting service after secret rotation.
3. Add abusive IPs to `BLOCKED_IPS`.
4. Temporarily enforce strict mode:
   - keep CSP in report mode off and enforce CSP
   - reduce rate limits for `POST /api/confessions`
   - raise admin login backoff by env rollout

## Investigation Checklist
1. Query recent audit logs for:
   - `admin_login_failed`
   - `security_alert`
   - `admin_deleted`
   - `confession_deleted`
2. Confirm actor, request path, IP fingerprint, and before/after state.
3. Identify blast radius:
   - affected admin users
   - affected confessions
   - time window

## Communication
1. SEV-1: notify stakeholders immediately.
2. Publish internal status update every 30 minutes until stabilized.
3. Record user-facing statement if any data risk is confirmed.

## Recovery
1. Restore normal rate limits after traffic normalizes.
2. Re-enable deferred features gradually.
3. Validate CI security checks are green:
   - `npm audit --audit-level=high`
   - dependency review check

## Post-Incident (within 48 hours)
1. Produce postmortem with root cause and prevention actions.
2. Add or tune detection rules for missed signals.
3. Update this runbook with learned actions.
