# Discord Bot Integration Guide (Beginner)

This guide explains terms, why each part exists, and how to integrate the bot into your Discord server safely.

## Architecture

You are using Architecture 2:

1. Web app API (`src/app/...`) exposes secure metrics at `/api/internal/discord-metrics`.
2. Separate Discord bot service (`apps/discord-bot`) polls that endpoint and posts updates.

Why this is preferred:

- Bot secrets stay isolated from web app cookies and admin sessions.
- Bot can be restarted/scaled independently.
- Access is machine-to-machine with one dedicated secret.

## Terms and practical meaning

- Bot Token: secret key used by the bot to log in to Discord.
- Client ID: Discord application ID used to register slash commands.
- Guild ID: your Discord server ID.
- Channel ID: where the pinned realtime status board lives.
- Role ID: role used to allow only trusted users to run commands.
- Slash command: chat command such as `/status`.
- Embed: rich-format Discord message for dashboard-like status.
- Poll interval: how often bot refreshes metrics from API.
- Least privilege: only grant permissions the bot needs.

## Server roles and permission model

Recommended roles:

1. `OpsBotOwner` (human role)
- Purpose: only trusted admins run bot commands.
- Mapped to env: `DISCORD_OWNER_ROLE_ID`.

2. `OpsBot` (bot role)
- Purpose: permissions for sending and editing status messages.

Recommended channels:

1. `ops-status`
- Pinned board updates every 15-30s.

2. `ops-alerts`
- Optional incident/error alerts.

3. `ops-bot-commands`
- Slash command interaction channel.

Bot role permissions (minimum):

- View Channels
- Send Messages
- Embed Links
- Read Message History
- Manage Messages (pin/update flow)
- Use Application Commands
- Attach Files

## Discord Developer Portal setup checklist

1. Create a new application.
2. Create a bot user under that application.
3. Enable required privileged settings only if needed (this bot currently only requires guild intent).
4. Copy Bot Token and store as `DISCORD_BOT_TOKEN`.
5. Copy Application ID and store as `DISCORD_CLIENT_ID`.
6. Invite bot to your server with scopes:
- `bot`
- `applications.commands`
7. Assign `OpsBot` role to the bot.
8. Assign `OpsBotOwner` role to trusted human admins.

## Web app configuration

Add to web app env:

- `DISCORD_METRICS_SECRET=<strong-random-secret>`

The bot calls:

- `GET /api/internal/discord-metrics`
- Header: `x-discord-metrics-secret: <DISCORD_METRICS_SECRET>`

## Bot service configuration

Use `apps/discord-bot/.env.example` and set:

- `DISCORD_BOT_TOKEN`
- `DISCORD_CLIENT_ID`
- `DISCORD_GUILD_ID`
- `DISCORD_OWNER_ROLE_ID`
- `DISCORD_STATUS_CHANNEL_ID`
- `DISCORD_METRICS_URL`
- `DISCORD_METRICS_SECRET`

Optional:

- `DISCORD_STATUS_MESSAGE_ID`
- `BOT_POLL_INTERVAL_MS` (default 60000; recommended 90000-120000 on free plans)
- `BOT_DEFAULT_GRAPH_DAYS` (default 7)
- `BOT_WEBHOOK_WINDOW_HOURS` (default 24)
- `BOT_METRICS_TIMEOUT_MS` (default 10000)
- `BOT_METRICS_RETRY_ATTEMPTS` (default 3)
- `BOT_METRICS_RETRY_BASE_MS` (default 700)
- `BOT_REALTIME_HISTORY_POINTS` (default 20)
- `BOT_DASHBOARD_URL` (optional link button URL in bot replies)
- `BOT_TRANSPARENCY_URL` (optional link button URL in bot replies)
- `BOT_HEADER_THUMBNAIL_URL` (optional logo thumbnail URL in bot embeds)
- `VERCEL_PROTECTION_BYPASS` (only when metrics URL points to a protected Vercel deployment; use the Vercel Protection Bypass for Automation secret, usually exposed there as `VERCEL_AUTOMATION_BYPASS_SECRET`)

## Deploy on Railway/Render/Fly

1. Create a new service from `apps/discord-bot`.
2. Build/install command:
- `npm install`
3. Start command:
- `npm run start`
4. Add all bot env vars in provider dashboard.
5. Confirm logs show:
- bot login success
- slash command registration success
- status board update success
- detailed Railway checklist: `docs/RAILWAY_DISCORD_BOT_DEPLOYMENT_CHECKLIST.md`

## Validation checklist

1. Run `/status` and confirm health + queue stats + realtime queue graph appear.
2. Run `/bot-health` and confirm scheduler/retry counters are visible and the response is a normal channel message (owner-only command, admin-deletable).
3. Run `/queue` and confirm pending/approved/rejected numbers.
4. Run `/webhook-health` and confirm channel statuses.
5. Remove owner role and confirm command is denied.

## Common first-time issues

1. `Missing Access` or command not visible:
- bot invite missing `applications.commands` scope.

2. `401 Unauthorized` from metrics endpoint:
- `DISCORD_METRICS_SECRET` mismatch between app and bot.

3. Pinned board not updating:
- bot lacks `Manage Messages` or wrong channel ID.

4. Graph image not appearing:
- outbound access to QuickChart blocked or URL filtered.

5. Commands work for everyone:
- wrong owner role ID or role-check not configured in env.
