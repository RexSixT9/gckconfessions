# Discord Ops Bot (Architecture 2)

Standalone Discord bot service for txAdmin-style live status and slash commands.

## What this bot does

- Updates one persistent status message in Discord on a low-frequency cadence (default 60s).
- Status message includes a submissions trend graph in the same embed.
- Provides slash commands:
  - `/bot-health` for bot runtime diagnostics (scheduler, retries, latency)
  - `/status` for API/site health + submissions trend graph (single embed)
  - `/queue` for confession status totals
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
- `BOT_POLL_INTERVAL_MS` (default `60000`, clamped to `30000-600000`)
- `BOT_DEFAULT_GRAPH_DAYS` (default `7`)
- `BOT_WEBHOOK_WINDOW_HOURS` (default `24`)
- `BOT_METRICS_TIMEOUT_MS` (default `10000`)
- `BOT_METRICS_RETRY_ATTEMPTS` (default `3`, range `1-5`)
- `BOT_METRICS_RETRY_BASE_MS` (default `700`, range `250-8000`)
- `BOT_REALTIME_HISTORY_POINTS` (default `20`, range `8-40`)
- `BOT_DASHBOARD_URL` (optional link button shown in bot responses)
- `BOT_TRANSPARENCY_URL` (optional link button shown in bot responses)
- `BOT_HEADER_THUMBNAIL_URL` (optional thumbnail/logo shown on bot embeds)
- `BOT_EPHEMERAL_COMMANDS` (optional CSV list; default `bot-health`)
- `BOT_PUBLIC_COMMANDS` (optional CSV list; default `status,queue,webhook-health`; takes precedence over ephemeral list)
- `VERCEL_PROTECTION_BYPASS` (only when metrics URL points to Vercel security-checkpoint protected deployment; set this to your project Protection Bypass for Automation secret, usually shown in Vercel as `VERCEL_AUTOMATION_BYPASS_SECRET`)

Visibility behavior:

- By default, `bot-health` replies are ephemeral (private to the invoker).
- By default, `status`, `queue`, and `webhook-health` replies are public.
- For ephemeral replies, navigation buttons are suppressed to avoid stale/irrelevant components.
- Error paths clear components explicitly so old buttons do not remain when embed state changes.

Local testing tip:

- Set `DISCORD_METRICS_URL=http://127.0.0.1:3000/api/internal/discord-metrics` to avoid remote protection pages while running locally.

## 3) Run locally

```bash
npm run dev
```

## 3.1) Typecheck and tests

```bash
npm run typecheck
npm test
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
- Status board recovery checks known recent bot messages to prevent duplicate boards.
- Global handlers log unhandled promise rejections and uncaught exceptions.
- Free-plan recommendation: start with `BOT_POLL_INTERVAL_MS=90000` or `120000` and only lower if needed.

## Code structure

- `src/index.ts`: runtime bootstrap and top-level event wiring.
- `src/features/board/status-loop.ts`: status board scheduler, message discovery/recovery, and board updates.
- `src/features/commands/router.ts`: slash-command routing.
- `src/features/commands/handlers/*.ts`: per-command handlers (`status`, `queue`, `bot-health`, `webhook-health`).
- `src/bot/config.ts`: env parsing and startup config validation.
- `src/bot/commands.ts`: slash command definitions.
- `src/bot/metrics-client.ts`: metrics endpoint fetch + retry/backoff logic.
- `src/bot/embeds.ts`: barrel for embed builders.
- `src/bot/embeds/*.ts`: focused embed modules (`status`, `queue`, `webhook-health`, `realtime`, `graph`, `bot-health`, `error`, `navigation`, `common`).
- `src/bot/runtime-state.ts`: mutable runtime state and counters.
- `src/bot/helpers.ts`: barrel for helper utilities.
- `src/bot/helpers/*.ts`: domain helper modules (`retry`, `network`, `health`, `time`, `formatting`).
- `src/bot/discord-runtime.ts`: Discord-specific helpers (role checks, registration).
- `src/bot/charts.ts`: QuickChart URL builders.
- `src/bot/constants.ts`: shared runtime constants.

## Discord permission checklist

Bot permissions (minimum recommended):
- View Channels
- Send Messages
- Embed Links
- Read Message History
- Manage Messages (optional; only needed if you want manual moderation actions)
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
- Channel ID: target channel for realtime status board.
- Role ID: used to authorize who can run bot commands.
- Slash Command: `/command` entrypoint for bot operations.
- Embed: rich styled message for dashboards and stats.
- Poll interval: how often bot refreshes metrics endpoint.
- Least privilege: grant only permissions the bot needs.
