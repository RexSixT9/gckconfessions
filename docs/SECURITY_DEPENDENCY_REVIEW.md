# Security Dependency Review

## Monthly Checklist
1. Review direct security-sensitive dependencies:
   - jose
   - bcryptjs
   - rate-limiter-flexible
   - ioredis
   - @arcjet/next
2. Review transitive dependency diffs from Dependabot PRs.
3. Run and inspect:
   - npm audit --audit-level=high
   - CI dependency review output
4. Confirm pinned overrides still match secure/stable releases.
5. Record decisions and remediation timeline for any high/critical findings.

## Ownership
- Primary: maintainer on duty
- Backup: repository admin

## Escalation
- Any critical vulnerability in auth/session/crypto paths is SEV-1 until mitigated.
