# Railway Discord Bot Deployment Checklist

This checklist is for deploying the Discord bot service from apps/discord-bot while the main app runs on Vercel.

## 1) Pre-deploy checks

- Confirm web app deployment is healthy on Vercel.
- Confirm bot source is current in repository.
- Confirm Discord application is created and bot is invited to target guild.
- Confirm bot role has required permissions:
  - View Channels
  - Send Messages
  - Embed Links
  - Read Message History
  - Manage Messages
  - Use Application Commands
  - Attach Files

## 2) Create shared secret

Use one strong secret value for both services.

PowerShell example:

```powershell
[Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Maximum 256 }))
```

Store this value as DISCORD_METRICS_SECRET in Vercel and Railway.

## 3) Configure Vercel (web app)

Required env vars for bot integration path:

```env
DISCORD_METRICS_SECRET=replace-with-strong-random-secret
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
```

Recommended fallback for SRV DNS issues:

```env
MONGODB_URI_DIRECT=mongodb://username:password@host1:27017,host2:27017,host3:27017/database?ssl=true&replicaSet=replace-with-real-replica-set&authSource=admin&retryWrites=true&w=majority
```

## 4) Create Railway bot service

- Service root: apps/discord-bot
- Install command: npm install
- Start command: npm run start
- Runtime: Node.js 20+

## 5) Configure Railway environment

Required:

```env
DISCORD_BOT_TOKEN=replace
DISCORD_CLIENT_ID=replace
DISCORD_GUILD_ID=replace
DISCORD_OWNER_ROLE_ID=replace
DISCORD_STATUS_CHANNEL_ID=replace
DISCORD_METRICS_URL=https://your-vercel-domain/api/internal/discord-metrics
DISCORD_METRICS_SECRET=replace-with-same-secret-as-vercel
```

Optional but recommended:

```env
DISCORD_STATUS_MESSAGE_ID=
BOT_POLL_INTERVAL_MS=90000
BOT_DEFAULT_GRAPH_DAYS=7
BOT_WEBHOOK_WINDOW_HOURS=24
BOT_METRICS_TIMEOUT_MS=10000
BOT_METRICS_RETRY_ATTEMPTS=3
BOT_METRICS_RETRY_BASE_MS=700
BOT_REALTIME_HISTORY_POINTS=20
BOT_DASHBOARD_URL=https://your-domain.com/admin
BOT_TRANSPARENCY_URL=https://your-domain.com/transparency
VERCEL_PROTECTION_BYPASS=
```

Free-plan guidance: use BOT_POLL_INTERVAL_MS in the 90000-120000 range to reduce background request volume.

Use VERCEL_PROTECTION_BYPASS only when your metrics URL is behind a Vercel protection checkpoint.
Set it to the Vercel Protection Bypass for Automation secret from your Vercel project
(usually shown there as VERCEL_AUTOMATION_BYPASS_SECRET).

## 6) First boot validation

- Confirm Railway logs show bot login success.
- Confirm Railway logs show slash command registration success.
- Confirm pinned status board appears in configured channel.
- Wait one poll cycle and confirm board updates again.
- Run slash commands as owner role:
  - /bot-health
  - /status
  - /queue
  - /webhook-health

## 7) Runtime acceptance criteria

- /bot-health shows zero or low consecutive failures.
- Metrics fetch success count increases over time.
- Status loop run count increases without repeated failures.
- Realtime graph appears in pinned status board and /status response.

## 8) Common issues and fixes

1. Symptom: 401 Unauthorized from metrics endpoint
- Cause: DISCORD_METRICS_SECRET mismatch between Vercel and Railway
- Fix: set identical values in both platforms and redeploy bot

2. Symptom: fetch timeout or frequent retries
- Cause: slow endpoint, networking issue, or low timeout
- Fix: increase BOT_METRICS_TIMEOUT_MS, verify Vercel health route latency, inspect Railway egress

3. Symptom: Vercel Security Checkpoint error
- Cause: protected Vercel deployment blocks bot
- Fix: set VERCEL_PROTECTION_BYPASS to your Vercel Protection Bypass for Automation secret (typically VERCEL_AUTOMATION_BYPASS_SECRET) or use unprotected internal route access

4. Symptom: multiple status board messages
- Cause: message id changed or bot lacked pin/read history previously
- Fix: keep Manage Messages + Read Message History permissions; optionally set DISCORD_STATUS_MESSAGE_ID explicitly

5. Symptom: database unavailable in metrics payload
- Cause: Mongo SRV DNS or cluster connectivity issue
- Fix: validate MONGODB_URI and set MONGODB_URI_DIRECT fallback in Vercel

6. Symptom: Initial status board update failed with ECONNREFUSED
- Cause: DISCORD_METRICS_URL points to localhost but web app is not running on that port in the bot environment
- Fix: start app locally (npm run dev in repo root) when local testing, or point DISCORD_METRICS_URL to your deployed Vercel URL

## 9) Rollback plan

- Revert bot image/deploy to previous known-good commit.
- Keep DISCORD_METRICS_SECRET unchanged.
- Keep status channel id unchanged to preserve existing board message.
- Re-run section 6 validation after rollback.
