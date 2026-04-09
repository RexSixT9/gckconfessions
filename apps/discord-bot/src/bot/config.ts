function cleanEnvValue(raw: unknown): string {
  if (typeof raw !== "string") return "";
  const trimmed = raw.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

function requiredEnv(name: string, errors: string[]): string {
  const value = cleanEnvValue(process.env[name]);
  if (!value) {
    errors.push(`Missing required env var: ${name}`);
    return "";
  }
  return value;
}

function optionalInt(name: string, fallback: number, min: number, max: number): number {
  const raw = cleanEnvValue(process.env[name]);
  if (!raw) return fallback;

  const parsed = Number(raw);
  if (!Number.isInteger(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

export interface BotConfig {
  botToken: string;
  clientId: string;
  guildId: string;
  ownerRoleId: string;
  statusChannelId: string;
  statusMessageId: string;
  metricsUrl: string;
  metricsSecret: string;
  pollIntervalMs: number;
  defaultGraphDays: number;
  webhookWindowHours: number;
  metricsTimeoutMs: number;
  metricsRetryAttempts: number;
  metricsRetryBaseMs: number;
  realtimeHistoryPoints: number;
  dashboardUrl: string;
  transparencyUrl: string;
  headerThumbnailUrl: string;
  vercelProtectionBypass: string;
}

export function buildConfig(): BotConfig {
  const errors: string[] = [];
  const vercelProtectionBypass =
    cleanEnvValue(process.env.VERCEL_PROTECTION_BYPASS) ||
    cleanEnvValue(process.env.VERCEL_AUTOMATION_BYPASS_SECRET);

  const cfg: BotConfig = {
    botToken: requiredEnv("DISCORD_BOT_TOKEN", errors),
    clientId: requiredEnv("DISCORD_CLIENT_ID", errors),
    guildId: requiredEnv("DISCORD_GUILD_ID", errors),
    ownerRoleId: requiredEnv("DISCORD_OWNER_ROLE_ID", errors),
    statusChannelId: requiredEnv("DISCORD_STATUS_CHANNEL_ID", errors),
    statusMessageId: cleanEnvValue(process.env.DISCORD_STATUS_MESSAGE_ID),
    metricsUrl: requiredEnv("DISCORD_METRICS_URL", errors),
    metricsSecret: requiredEnv("DISCORD_METRICS_SECRET", errors),
    pollIntervalMs: optionalInt("BOT_POLL_INTERVAL_MS", 60_000, 30_000, 600_000),
    defaultGraphDays: optionalInt("BOT_DEFAULT_GRAPH_DAYS", 7, 1, 30),
    webhookWindowHours: optionalInt("BOT_WEBHOOK_WINDOW_HOURS", 24, 1, 168),
    metricsTimeoutMs: optionalInt("BOT_METRICS_TIMEOUT_MS", 10_000, 2_000, 60_000),
    metricsRetryAttempts: optionalInt("BOT_METRICS_RETRY_ATTEMPTS", 3, 1, 5),
    metricsRetryBaseMs: optionalInt("BOT_METRICS_RETRY_BASE_MS", 700, 250, 8_000),
    realtimeHistoryPoints: optionalInt("BOT_REALTIME_HISTORY_POINTS", 20, 8, 40),
    dashboardUrl: cleanEnvValue(process.env.BOT_DASHBOARD_URL),
    transparencyUrl: cleanEnvValue(process.env.BOT_TRANSPARENCY_URL),
    headerThumbnailUrl: cleanEnvValue(process.env.BOT_HEADER_THUMBNAIL_URL),
    vercelProtectionBypass,
  };

  if (cfg.metricsUrl) {
    try {
      const parsed = new URL(cfg.metricsUrl);
      const protocol = parsed.protocol.toLowerCase();
      if (protocol !== "http:" && protocol !== "https:") {
        errors.push("DISCORD_METRICS_URL must use http:// or https://");
      }
    } catch {
      errors.push("DISCORD_METRICS_URL is not a valid URL");
    }
  }

  for (const [name, value] of [
    ["BOT_DASHBOARD_URL", cfg.dashboardUrl],
    ["BOT_TRANSPARENCY_URL", cfg.transparencyUrl],
    ["BOT_HEADER_THUMBNAIL_URL", cfg.headerThumbnailUrl],
  ] as const) {
    if (!value) continue;

    try {
      const parsed = new URL(value);
      const protocol = parsed.protocol.toLowerCase();
      if (protocol !== "http:" && protocol !== "https:") {
        errors.push(`${name} must use http:// or https://`);
      }
    } catch {
      errors.push(`${name} is not a valid URL`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`Invalid bot environment configuration:\n- ${errors.join("\n- ")}`);
  }

  return cfg;
}
