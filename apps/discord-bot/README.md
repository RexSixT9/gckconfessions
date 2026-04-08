# Discord Ops Bot (Architecture 2)

Standalone Discord bot service for txAdmin-style live status and slash commands.

## What this bot does

- Updates one pinned status message in Discord every 15-30 seconds.
- Pinned status message includes a realtime queue graph.
- Provides slash commands:
  - `/bot-health` for bot runtime diagnostics (scheduler, retries, latency)
  - `/status` for API/site health + realtime queue graph
  - `/queue` for confession status totals
  - `/graph` for confession metrics chart
  - `/webhook-health` for Discord/webhook/email delivery health
- Reads from the app's internal metrics endpoint: `/api/internal/discord-metrics`.

## 1) Install

```bash
cd apps/discord-bot
npm install
```

## 2) Configure env vars

Copy `.env.example` into `.env` and set all required variables.

Required:
- `DISCORD_BOT_TOKEN`
- `DISCORD_CLIENT_ID`
- `DISCORD_GUILD_ID`
- `DISCORD_OWNER_ROLE_ID`
- `DISCORD_STATUS_CHANNEL_ID`
- `DISCORD_METRICS_URL`
- `DISCORD_METRICS_SECRET`

Optional:
- `DISCORD_STATUS_MESSAGE_ID`
- `BOT_POLL_INTERVAL_MS` (default `20000`)
- `BOT_DEFAULT_GRAPH_DAYS` (default `7`)
- `BOT_WEBHOOK_WINDOW_HOURS` (default `24`)
- `BOT_METRICS_TIMEOUT_MS` (default `10000`)
- `BOT_METRICS_RETRY_ATTEMPTS` (default `3`, range `1-5`)
- `BOT_METRICS_RETRY_BASE_MS` (default `700`, range `250-8000`)
- `BOT_REALTIME_HISTORY_POINTS` (default `20`, range `8-40`)
- `BOT_DASHBOARD_URL` (optional link button shown in bot responses)
- `BOT_TRANSPARENCY_URL` (optional link button shown in bot responses)
- `VERCEL_PROTECTION_BYPASS` (only when metrics URL points to Vercel security-checkpoint protected deployment)

Local testing tip:

- Set `DISCORD_METRICS_URL=http://127.0.0.1:3000/api/internal/discord-metrics` to avoid remote protection pages while running locally.

## 3) Run locally

```bash
npm run dev
```

## 4) Deploy (Railway/Render/Fly)

- Create a new service from `apps/discord-bot`.
- Set all env vars in provider dashboard.
- Start command: `npm run start`.
- Runtime note: bot loads `.env` automatically when present (for local/prod parity), and still works with provider-injected env vars.
- Full Railway runbook: see `docs/RAILWAY_DISCORD_BOT_DEPLOYMENT_CHECKLIST.md` from repo root.

## Reliability behavior

- Metrics fetch uses timeout + bounded retries with exponential backoff.
- Status board refresh uses a single-flight scheduler to avoid overlapping edits.
- Status board recovery checks pinned messages first to prevent duplicate boards.
- Global handlers log unhandled promise rejections and uncaught exceptions.

## Code structure

- `src/index.mjs`: thin runtime entrypoint and orchestration.
- `src/bot/config.mjs`: env parsing and startup config validation.
- `src/bot/commands.mjs`: slash command definitions.
- `src/bot/metrics-client.mjs`: metrics endpoint fetch + retry/backoff logic.
- `src/bot/embeds.mjs`: all Discord embed and response presentation.
- `src/bot/runtime-state.mjs`: mutable runtime state and counters.
- `src/bot/helpers.mjs`: shared formatting/time/network helper utilities.
- `src/bot/discord-runtime.mjs`: Discord-specific helpers (role checks, registration).
- `src/bot/charts.mjs`: QuickChart URL builders.

## Discord permission checklist

Bot permissions (minimum recommended):
- View Channels
- Send Messages
- Embed Links
- Read Message History
- Manage Messages (for pin/update workflow)
- Use Application Commands
- Attach Files

Role setup:
- Create a role for bot owners (for example `OpsBotOwner`).
- Put its ID in `DISCORD_OWNER_ROLE_ID`.
- Only this role can run slash commands.

## Term glossary

- Bot Token: secret used by bot process to log into Discord.
- Client ID: unique app ID for command registration.
- Guild ID: Discord server ID where commands are registered.
- Channel ID: target channel for pinned realtime status board.
- Role ID: used to authorize who can run bot commands.
- Slash Command: `/command` entrypoint for bot operations.
- Embed: rich styled message for dashboards and stats.
- Poll interval: how often bot refreshes metrics endpoint.
- Least privilege: grant only permissions the bot needs.
