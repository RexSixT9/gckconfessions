import "dotenv/config";

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  Client,
  EmbedBuilder,
  GatewayIntentBits,
  MessageFlags,
  REST,
  Routes,
  SlashCommandBuilder,
} from "discord.js";

const STATUS_MARKER = "[gck-ops-status-board]";
const METRICS_ERROR_LOG_COOLDOWN_MS = 60_000;
const MAX_EMBED_IMAGE_URL_LENGTH = 2_000;

function cleanEnvValue(raw) {
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

function requiredEnv(name, errors) {
  const value = cleanEnvValue(process.env[name]);
  if (!value) {
    errors.push(`Missing required env var: ${name}`);
    return "";
  }
  return value;
}

function optionalInt(name, fallback, min, max) {
  const raw = cleanEnvValue(process.env[name]);
  if (!raw) return fallback;

  const parsed = Number(raw);
  if (!Number.isInteger(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

function buildConfig() {
  const errors = [];

  const cfg = {
    botToken: requiredEnv("DISCORD_BOT_TOKEN", errors),
    clientId: requiredEnv("DISCORD_CLIENT_ID", errors),
    guildId: requiredEnv("DISCORD_GUILD_ID", errors),
    ownerRoleId: requiredEnv("DISCORD_OWNER_ROLE_ID", errors),
    statusChannelId: requiredEnv("DISCORD_STATUS_CHANNEL_ID", errors),
    statusMessageId: cleanEnvValue(process.env.DISCORD_STATUS_MESSAGE_ID),
    metricsUrl: requiredEnv("DISCORD_METRICS_URL", errors),
    metricsSecret: requiredEnv("DISCORD_METRICS_SECRET", errors),
    pollIntervalMs: optionalInt("BOT_POLL_INTERVAL_MS", 20_000, 10_000, 120_000),
    defaultGraphDays: optionalInt("BOT_DEFAULT_GRAPH_DAYS", 7, 1, 30),
    webhookWindowHours: optionalInt("BOT_WEBHOOK_WINDOW_HOURS", 24, 1, 168),
    metricsTimeoutMs: optionalInt("BOT_METRICS_TIMEOUT_MS", 10_000, 2_000, 60_000),
    metricsRetryAttempts: optionalInt("BOT_METRICS_RETRY_ATTEMPTS", 3, 1, 5),
    metricsRetryBaseMs: optionalInt("BOT_METRICS_RETRY_BASE_MS", 700, 250, 8_000),
    realtimeHistoryPoints: optionalInt("BOT_REALTIME_HISTORY_POINTS", 20, 8, 40),
    dashboardUrl: cleanEnvValue(process.env.BOT_DASHBOARD_URL),
    transparencyUrl: cleanEnvValue(process.env.BOT_TRANSPARENCY_URL),
    vercelProtectionBypass: cleanEnvValue(process.env.VERCEL_PROTECTION_BYPASS),
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
  ]) {
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

const config = buildConfig();

let isShuttingDown = false;
let shutdownStarted = false;
let statusTimer = null;
let nextStatusRunAt = 0;
let statusUpdateInFlight = false;

const realtimeHistory = [];

const runtimeStats = {
  startedAt: Date.now(),
  fetch: {
    total: 0,
    retries: 0,
    successes: 0,
    failures: 0,
    consecutiveFailures: 0,
    lastAttemptAt: 0,
    lastSuccessAt: 0,
    lastFailureAt: 0,
    lastDurationMs: 0,
    lastError: "",
  },
  statusLoop: {
    runs: 0,
    skipped: 0,
    successes: 0,
    failures: 0,
    consecutiveFailures: 0,
    lastRunAt: 0,
    lastSuccessAt: 0,
    lastFailureAt: 0,
    lastDurationMs: 0,
    lastError: "",
  },
  commands: {
    total: 0,
    lastAt: 0,
    byName: {},
  },
};

let lastMetricsErrorKey = "";
let lastMetricsErrorAt = 0;

function logMetricsError(scope, error) {
  const now = Date.now();
  const key = error instanceof Error ? error.message.slice(0, 180) : String(error).slice(0, 180);
  if (key === lastMetricsErrorKey && now - lastMetricsErrorAt < METRICS_ERROR_LOG_COOLDOWN_MS) {
    return;
  }

  lastMetricsErrorKey = key;
  lastMetricsErrorAt = now;
  console.error(scope, error);
}

function summarizeBody(body) {
  return body.replace(/\s+/g, " ").slice(0, 260);
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function parseRetryAfterMs(value) {
  if (!value) return 0;

  const asSeconds = Number(value);
  if (Number.isFinite(asSeconds) && asSeconds > 0) {
    return Math.round(asSeconds * 1_000);
  }

  const asDate = Date.parse(value);
  if (Number.isFinite(asDate)) {
    return Math.max(0, asDate - Date.now());
  }

  return 0;
}

function retryDelayMs(attempt) {
  const backoff = config.metricsRetryBaseMs * 2 ** Math.max(0, attempt - 1);
  const jitter = Math.floor(Math.random() * 250);
  return Math.min(15_000, backoff + jitter);
}

function isRetryableHttpStatus(statusCode) {
  return statusCode === 408 || statusCode === 425 || statusCode === 429 || statusCode >= 500;
}

function asNonRetryable(error) {
  if (error && typeof error === "object") {
    error.nonRetryable = true;
  }
  return error;
}

function durationLabel(ms) {
  const value = Number(ms || 0);
  if (!Number.isFinite(value) || value <= 0) return "0ms";
  if (value < 1_000) return `${Math.round(value)}ms`;
  if (value < 60_000) return `${(value / 1_000).toFixed(2)}s`;
  return `${(value / 60_000).toFixed(2)}m`;
}

function sinceLabel(timestampMs) {
  const value = Number(timestampMs || 0);
  if (!Number.isFinite(value) || value <= 0) return "never";

  const delta = Math.max(0, Date.now() - value);
  const seconds = Math.floor(delta / 1_000);
  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function untilLabel(timestampMs) {
  const value = Number(timestampMs || 0);
  if (!Number.isFinite(value) || value <= 0) return "not scheduled";

  const delta = Math.max(0, value - Date.now());
  const seconds = Math.floor(delta / 1_000);
  if (seconds < 60) return `in ${seconds}s`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `in ${minutes}m`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `in ${hours}h`;

  const days = Math.floor(hours / 24);
  return `in ${days}d`;
}

function nextRunLabel() {
  return untilLabel(nextStatusRunAt);
}

function trackCommandUsage(commandName) {
  runtimeStats.commands.total += 1;
  runtimeStats.commands.lastAt = Date.now();
  runtimeStats.commands.byName[commandName] = (runtimeStats.commands.byName[commandName] || 0) + 1;
}

const slashCommands = [
  new SlashCommandBuilder().setName("status").setDescription("Show live API and site health.").setDMPermission(false),
  new SlashCommandBuilder().setName("queue").setDescription("Show confession queue totals.").setDMPermission(false),
  new SlashCommandBuilder()
    .setName("bot-health")
    .setDescription("Show Discord bot runtime diagnostics.")
    .setDMPermission(false),
  new SlashCommandBuilder()
    .setName("graph")
    .setDescription("Show confession metrics chart.")
    .addIntegerOption((option) =>
      option
        .setName("days")
        .setDescription("Days to include (1-30).")
        .setMinValue(1)
        .setMaxValue(30)
    )
    .setDMPermission(false),
  new SlashCommandBuilder()
    .setName("webhook-health")
    .setDescription("Show webhook delivery health by channel.")
    .setDMPermission(false),
];

function compactNumber(value) {
  return Intl.NumberFormat("en-US").format(Number(value || 0));
}

function toIsoTimestamp(value) {
  const date = new Date(value || Date.now());
  if (Number.isNaN(date.getTime())) return new Date().toISOString();
  return date.toISOString();
}

function statusLabel(status) {
  const normalized = String(status || "unknown").toLowerCase();
  if (normalized === "healthy") return "HEALTHY";
  if (normalized === "degraded") return "DEGRADED";
  if (normalized === "down") return "DOWN";
  return "UNKNOWN";
}

function statusIcon(status) {
  const normalized = String(status || "unknown").toLowerCase();
  if (normalized === "healthy") return "🟢";
  if (normalized === "degraded") return "🟠";
  if (normalized === "down") return "🔴";
  return "⚪";
}

function statusColor(status) {
  const normalized = String(status || "unknown").toLowerCase();
  if (normalized === "healthy") return 0x2f9e44;
  if (normalized === "degraded") return 0xf08c00;
  if (normalized === "down") return 0xe03131;
  return 0x495057;
}

function queueColor(queue) {
  const pending = Number(queue?.pending || 0);
  if (pending >= 80) return 0xe03131;
  if (pending >= 30) return 0xf08c00;
  return 0x2f9e44;
}

function queueIcon(queue) {
  const pending = Number(queue?.pending || 0);
  if (pending >= 80) return "🚨";
  if (pending >= 30) return "⚠️";
  return "✅";
}

function recordRealtimePoint(metrics) {
  const queue = metrics?.queue || {};
  const point = {
    at: toIsoTimestamp(metrics?.generatedAt),
    pending: Number(queue.pending || 0),
    approved: Number(queue.approved || 0),
    published: Number(queue.published || 0),
    total: Number(queue.total || 0),
  };

  const last = realtimeHistory.at(-1);
  if (last && last.at === point.at) {
    realtimeHistory[realtimeHistory.length - 1] = point;
  } else {
    realtimeHistory.push(point);
  }

  while (realtimeHistory.length > config.realtimeHistoryPoints) {
    realtimeHistory.shift();
  }
}

function historyForChart(currentMetrics) {
  const withCurrent = [...realtimeHistory];
  const currentAt = toIsoTimestamp(currentMetrics?.generatedAt);

  if (!withCurrent.some((point) => point.at === currentAt)) {
    const queue = currentMetrics?.queue || {};
    withCurrent.push({
      at: currentAt,
      pending: Number(queue.pending || 0),
      approved: Number(queue.approved || 0),
      published: Number(queue.published || 0),
      total: Number(queue.total || 0),
    });
  }

  if (withCurrent.length <= config.realtimeHistoryPoints) {
    return withCurrent;
  }

  return withCurrent.slice(withCurrent.length - config.realtimeHistoryPoints);
}

function memberHasOwnerRole(interaction) {
  const roleId = config.ownerRoleId;
  if (!roleId) return false;

  const member = interaction.member;
  if (!member) return false;

  const roles = member.roles;
  if (Array.isArray(roles)) {
    return roles.includes(roleId);
  }

  if (roles && roles.cache) {
    return roles.cache.has(roleId);
  }

  return false;
}

async function fetchMetrics(days = config.defaultGraphDays) {
  const fetchStartedAt = Date.now();
  runtimeStats.fetch.total += 1;
  runtimeStats.fetch.lastAttemptAt = fetchStartedAt;

  const url = new URL(config.metricsUrl);
  url.searchParams.set("days", String(days));
  url.searchParams.set("webhookHours", String(config.webhookWindowHours));

  const headers = {
    "x-discord-metrics-secret": config.metricsSecret,
    accept: "application/json",
    "user-agent": "gck-discord-bot/0.1",
  };

  if (config.vercelProtectionBypass) {
    headers["x-vercel-protection-bypass"] = config.vercelProtectionBypass;
  }

  let lastError = null;

  for (let attempt = 1; attempt <= config.metricsRetryAttempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.metricsTimeoutMs);

    try {
      const response = await fetch(url, {
        method: "GET",
        headers,
        cache: "no-store",
        signal: controller.signal,
      });

      const contentType = response.headers.get("content-type") || "";
      const bodyText = await response.text();
      const retryAfter = response.headers.get("retry-after") || "";

      if (!response.ok) {
        const checkpointBlocked = bodyText.includes("Vercel Security Checkpoint");
        const retryAfterMs = parseRetryAfterMs(retryAfter);
        const retryPart = retryAfter ? ` retry-after=${retryAfter}.` : "";

        if (checkpointBlocked) {
          throw new Error(
            `Metrics fetch blocked by Vercel Security Checkpoint (${response.status}).${retryPart} Use a local URL for local testing or set VERCEL_PROTECTION_BYPASS when targeting protected Vercel deployments.`
          );
        }

        const attemptError = new Error(
          `Metrics fetch failed (${response.status}) on attempt ${attempt}/${config.metricsRetryAttempts}.${retryPart} body=${summarizeBody(bodyText)}`
        );

        if (!isRetryableHttpStatus(response.status) || attempt >= config.metricsRetryAttempts) {
          throw asNonRetryable(attemptError);
        }

        runtimeStats.fetch.retries += 1;
        const delayMs = Math.max(retryAfterMs, retryDelayMs(attempt));
        await sleep(delayMs);
        lastError = attemptError;
        continue;
      }

      if (!contentType.toLowerCase().includes("application/json")) {
        const checkpointLike = bodyText.includes("Vercel Security Checkpoint");
        const suffix = checkpointLike
          ? " (looks like Vercel protection HTML)"
          : "";
        throw asNonRetryable(
          new Error(`Metrics endpoint returned non-JSON content-type: ${contentType || "unknown"}${suffix}`)
        );
      }

      try {
        const parsed = JSON.parse(bodyText);
        runtimeStats.fetch.successes += 1;
        runtimeStats.fetch.consecutiveFailures = 0;
        runtimeStats.fetch.lastSuccessAt = Date.now();
        runtimeStats.fetch.lastDurationMs = Date.now() - fetchStartedAt;
        runtimeStats.fetch.lastError = "";
        return parsed;
      } catch {
        throw asNonRetryable(new Error("Metrics endpoint response was not valid JSON."));
      }
    } catch (error) {
      const timedOut = error instanceof Error && error.name === "AbortError";
      const attemptError = timedOut
        ? new Error(
            `Metrics fetch timed out after ${config.metricsTimeoutMs}ms (attempt ${attempt}/${config.metricsRetryAttempts}).`
          )
        : error;

      lastError = attemptError;

      const shouldRetry =
        attempt < config.metricsRetryAttempts &&
        !(attemptError && typeof attemptError === "object" && attemptError.nonRetryable === true) &&
        !String(attemptError instanceof Error ? attemptError.message : "").includes(
          "Vercel Security Checkpoint"
        );

      if (!shouldRetry) {
        runtimeStats.fetch.failures += 1;
        runtimeStats.fetch.consecutiveFailures += 1;
        runtimeStats.fetch.lastFailureAt = Date.now();
        runtimeStats.fetch.lastDurationMs = Date.now() - fetchStartedAt;
        runtimeStats.fetch.lastError = String(
          attemptError instanceof Error ? attemptError.message : attemptError || "unknown"
        ).slice(0, 220);
        throw attemptError;
      }

      runtimeStats.fetch.retries += 1;
      await sleep(retryDelayMs(attempt));
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Metrics fetch failed after retries.");
}

function buildStatusEmbed(metrics) {
  const health = metrics?.health || {};
  const queue = metrics?.queue || {};
  const api = health?.api || {};
  const issues = Array.isArray(health?.issues) ? health.issues : [];
  const databaseStatus = health?.database?.status || "unknown";

  const embed = new EmbedBuilder()
    .setTitle("🛰️ GCK Ops Live Status")
    .setColor(statusColor(health?.overallStatus))
    .setDescription(
      `${statusIcon(health?.overallStatus)} Overall **${statusLabel(health?.overallStatus)}**`
    )
    .addFields(
      {
        name: "⚙️ API",
        value: [
          `${statusIcon(api.status === "ok" ? "healthy" : "degraded")} Status: ${String(api.status || "unknown").toUpperCase()}`,
          `🧭 Uptime: ${compactNumber(api.uptimeSeconds || 0)}s`,
          `🌍 Env: ${api.environment || "unknown"}`,
        ].join("\n"),
        inline: true,
      },
      {
        name: `${queueIcon(queue)} Queue`,
        value: [
          `🕒 Pending: ${compactNumber(queue.pending)}`,
          `✅ Approved: ${compactNumber(queue.approved)}`,
          `⛔ Rejected: ${compactNumber(queue.rejected)}`,
          `📣 Published: ${compactNumber(queue.published)}`,
          `📦 Total: ${compactNumber(queue.total)}`,
        ].join("\n"),
        inline: true,
      },
      {
        name: "🔔 Delivery",
        value: [
          `${statusIcon(metrics?.webhookHealth?.overallStatus)} Overall: ${statusLabel(metrics?.webhookHealth?.overallStatus)}`,
          `🪟 Window: ${compactNumber(metrics?.webhookHealth?.windowHours || 0)}h`,
          `${statusIcon(databaseStatus)} DB: ${String(databaseStatus).toUpperCase()}`,
        ].join("\n"),
        inline: true,
      }
    )
    .setFooter({ text: `Schema v${metrics?.schemaVersion ?? 1}` })
    .setTimestamp(new Date(metrics?.generatedAt || Date.now()));

  if (issues.length > 0) {
    embed.addFields({
      name: "🧯 Active Issues",
      value: issues.slice(0, 5).join("\n"),
    });
  }

  return embed;
}

function buildQueueEmbed(metrics) {
  const queue = metrics?.queue || {};
  return new EmbedBuilder()
    .setTitle(`${queueIcon(queue)} Confession Queue Snapshot`)
    .setColor(queueColor(queue))
    .addFields(
      { name: "🕒 Pending", value: compactNumber(queue.pending), inline: true },
      { name: "✅ Approved", value: compactNumber(queue.approved), inline: true },
      { name: "⛔ Rejected", value: compactNumber(queue.rejected), inline: true },
      { name: "📣 Published", value: compactNumber(queue.published), inline: true },
      { name: "📦 Total", value: compactNumber(queue.total), inline: true }
    )
    .setDescription("Queue pressure is color-coded by pending backlog.")
    .setTimestamp(new Date(metrics?.generatedAt || Date.now()));
}

function channelDisplayName(name) {
  if (name === "audit_discord") return "🧾 Audit Discord";
  if (name === "security_webhook") return "🛡️ Security Webhook";
  if (name === "security_email") return "📨 Security Email";
  return `🔹 ${name}`;
}

function buildWebhookHealthEmbed(metrics) {
  const channels = metrics?.webhookHealth?.channels || {};

  const channelLines = Object.entries(channels).map(([name, value]) => {
    const row = value || {};
    return [
      `${channelDisplayName(name)}`,
      `${statusIcon(row.status)} Status: ${statusLabel(row.status)}`,
      `🧪 Attempts: ${compactNumber(row.attempts)}`,
      `✅ Successes: ${compactNumber(row.successes)}`,
      `❌ Failures: ${compactNumber(row.failures)}`,
      `📈 Success rate: ${row.successRate === null ? "n/a" : `${Number(row.successRate * 100).toFixed(2)}%`}`,
    ].join("\n");
  });

  return new EmbedBuilder()
    .setTitle("🔔 Webhook Delivery Health")
    .setColor(statusColor(metrics?.webhookHealth?.overallStatus))
    .setDescription(
      `${statusIcon(metrics?.webhookHealth?.overallStatus)} Overall: ${statusLabel(metrics?.webhookHealth?.overallStatus)} | 🪟 Window: ${compactNumber(metrics?.webhookHealth?.windowHours || 0)}h`
    )
    .addFields(
      channelLines.length > 0
        ? channelLines.map((value, index) => ({
            name: `Channel ${index + 1}`,
            value,
          }))
        : [{ name: "Channels", value: "No channel data" }]
    )
    .setTimestamp(new Date(metrics?.generatedAt || Date.now()));
}

function buildQuickChartUrl(daily) {
  const labels = daily.map((point) => point.day.slice(5));
  const submissions = daily.map((point) => point.submissions);
  const published = daily.map((point) => point.published);

  const chartConfig = {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Submissions",
          data: submissions,
          backgroundColor: "#0b7285",
          borderColor: "#0b7285",
          borderWidth: 1,
        },
        {
          type: "line",
          label: "Published",
          data: published,
          borderColor: "#2f9e44",
          backgroundColor: "#2f9e44",
          borderWidth: 2,
          fill: false,
          tension: 0.32,
          pointRadius: 2,
        },
      ],
    },
    options: {
      layout: {
        padding: 12,
      },
      plugins: {
        legend: { display: true },
        title: {
          display: true,
          text: "Confessions Per Day",
          color: "#1f2937",
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { precision: 0, color: "#374151" },
          grid: { color: "#e5e7eb" },
        },
        x: {
          ticks: { color: "#374151" },
          grid: { display: false },
        },
      },
      backgroundColor: "#f8fafc",
    },
  };

  const url = `https://quickchart.io/chart?width=1000&height=420&c=${encodeURIComponent(JSON.stringify(chartConfig))}`;
  return url.length <= MAX_EMBED_IMAGE_URL_LENGTH ? url : "";
}

function buildRealtimeQueueChartUrl(points) {
  const labels = points.map((point) => {
    const date = new Date(point.at);
    return date.toISOString().slice(11, 16);
  });

  const pending = points.map((point) => point.pending);
  const total = points.map((point) => point.total);

  const chartConfig = {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Pending",
          data: pending,
          borderColor: "#d9480f",
          backgroundColor: "rgba(217,72,15,0.18)",
          fill: true,
          borderWidth: 2,
          tension: 0.3,
          pointRadius: 2,
        },
        {
          label: "Total",
          data: total,
          borderColor: "#0b7285",
          backgroundColor: "rgba(11,114,133,0.16)",
          fill: true,
          borderWidth: 2,
          tension: 0.3,
          pointRadius: 2,
        },
      ],
    },
    options: {
      layout: {
        padding: 12,
      },
      plugins: {
        legend: { display: true },
        title: {
          display: true,
          text: "Realtime Queue Trend",
          color: "#1f2937",
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { precision: 0, color: "#374151" },
          grid: { color: "#e5e7eb" },
        },
        x: {
          ticks: { color: "#374151" },
          grid: { display: false },
        },
      },
      backgroundColor: "#fefce8",
    },
  };

  const url = `https://quickchart.io/chart?width=1000&height=340&c=${encodeURIComponent(JSON.stringify(chartConfig))}`;
  return url.length <= MAX_EMBED_IMAGE_URL_LENGTH ? url : "";
}

function buildRealtimeEmbed(metrics) {
  const points = historyForChart(metrics);
  const embed = new EmbedBuilder()
    .setTitle("📈 Realtime Queue Graph")
    .setColor(0x0b7285)
    .setDescription(`Tracking latest ${compactNumber(points.length)} board samples.`)
    .setTimestamp(new Date(metrics?.generatedAt || Date.now()));

  if (points.length < 2) {
    embed.addFields({
      name: "Graph Warmup",
      value: "Collecting datapoints. Graph appears after the next status refresh.",
    });
    return embed;
  }

  const chartUrl = buildRealtimeQueueChartUrl(points);
  if (!chartUrl) {
    embed.addFields({
      name: "Graph Skipped",
      value: "Chart URL exceeded embed limits. Reduce BOT_REALTIME_HISTORY_POINTS.",
    });
    return embed;
  }

  embed.setImage(chartUrl);
  return embed;
}

function buildGraphEmbed(metrics, days) {
  const daily = Array.isArray(metrics?.daily) ? metrics.daily : [];
  const totalSubmissions = daily.reduce((sum, point) => sum + Number(point.submissions || 0), 0);
  const totalPublished = daily.reduce((sum, point) => sum + Number(point.published || 0), 0);

  const embed = new EmbedBuilder()
    .setTitle(`📊 Confession Graph (${days}d)`)
    .setColor(0x0b7285)
    .setDescription(
      `📝 Submissions: ${compactNumber(totalSubmissions)} | 📣 Published: ${compactNumber(totalPublished)}`
    )
    .setTimestamp(new Date(metrics?.generatedAt || Date.now()));

  if (daily.length > 0) {
    const chartUrl = buildQuickChartUrl(daily);
    if (chartUrl) {
      embed.setImage(chartUrl);
    } else {
      embed.addFields({
        name: "Chart Skipped",
        value: "Chart URL exceeded embed limits. Try a lower /graph days value.",
      });
    }
  } else {
    embed.addFields({
      name: "No Data",
      value: "No confession data available for the selected window.",
    });
  }

  return embed;
}

function buildErrorEmbed(message) {
  return new EmbedBuilder()
    .setTitle("❌ Bot Command Failed")
    .setColor(0xe03131)
    .setDescription(message)
    .setTimestamp(new Date());
}

function metricsErrorHint(error) {
  const text = String(error instanceof Error ? error.message : error || "");
  if (text.includes("401") || text.toLowerCase().includes("unauthorized")) {
    return "Metrics authentication failed. Verify DISCORD_METRICS_SECRET matches Vercel.";
  }
  if (text.includes("429")) {
    return "Metrics API is rate limiting requests. Increase poll interval or wait briefly.";
  }
  if (text.includes("Vercel Security Checkpoint")) {
    return "Vercel security checkpoint blocked bot access. Configure VERCEL_PROTECTION_BYPASS.";
  }
  if (text.toLowerCase().includes("timed out")) {
    return "Metrics request timed out. Check Vercel response time and network egress from Railway.";
  }
  return "Check bot logs and internal metrics endpoint configuration.";
}

function buildNavigationComponents() {
  const buttons = [];

  if (config.dashboardUrl) {
    buttons.push(
      new ButtonBuilder()
        .setStyle(ButtonStyle.Link)
        .setLabel("Admin Dashboard")
        .setEmoji("🛠️")
        .setURL(config.dashboardUrl)
    );
  }

  if (config.transparencyUrl) {
    buttons.push(
      new ButtonBuilder()
        .setStyle(ButtonStyle.Link)
        .setLabel("Transparency")
        .setEmoji("📜")
        .setURL(config.transparencyUrl)
    );
  }

  if (buttons.length === 0) {
    return [];
  }

  return [new ActionRowBuilder().addComponents(...buttons)];
}

function buildBotHealthEmbed() {
  const fetch = runtimeStats.fetch;
  const loop = runtimeStats.statusLoop;
  const commands = runtimeStats.commands;

  const sortedCommands = Object.entries(commands.byName)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([name, count]) => `${name}: ${compactNumber(count)}`)
    .join("\n");

  const degraded = fetch.consecutiveFailures > 0 || loop.consecutiveFailures > 0;

  const embed = new EmbedBuilder()
    .setTitle("🩺 Bot Runtime Health")
    .setColor(degraded ? 0xf08c00 : 0x2f9e44)
    .setDescription(
      `${degraded ? "🟠" : "🟢"} Runtime is ${degraded ? "degraded" : "healthy"}.`
    )
    .addFields(
      {
        name: "⏱️ Runtime",
        value: [
          `Uptime: ${durationLabel(Date.now() - runtimeStats.startedAt)}`,
          `Shutting down: ${isShuttingDown ? "yes" : "no"}`,
          `Status in-flight: ${statusUpdateInFlight ? "yes" : "no"}`,
          `Next status run: ${nextRunLabel()}`,
        ].join("\n"),
      },
      {
        name: "🌐 Metrics Fetch",
        value: [
          `Total: ${compactNumber(fetch.total)} (ok ${compactNumber(fetch.successes)}, fail ${compactNumber(fetch.failures)})`,
          `Retries: ${compactNumber(fetch.retries)} | Consecutive fail: ${compactNumber(fetch.consecutiveFailures)}`,
          `Last latency: ${durationLabel(fetch.lastDurationMs)}`,
          `Last success: ${sinceLabel(fetch.lastSuccessAt)} | Last fail: ${sinceLabel(fetch.lastFailureAt)}`,
        ].join("\n"),
      },
      {
        name: "🔄 Status Loop",
        value: [
          `Runs: ${compactNumber(loop.runs)} (ok ${compactNumber(loop.successes)}, fail ${compactNumber(loop.failures)})`,
          `Skipped: ${compactNumber(loop.skipped)} | Consecutive fail: ${compactNumber(loop.consecutiveFailures)}`,
          `Last run: ${sinceLabel(loop.lastRunAt)} | Last duration: ${durationLabel(loop.lastDurationMs)}`,
          `Board message id: ${runtimeStatusMessageId || "not set"}`,
        ].join("\n"),
      },
      {
        name: "🧪 Commands",
        value: [
          `Total: ${compactNumber(commands.total)} | Last used: ${sinceLabel(commands.lastAt)}`,
          `Top commands:\n${sortedCommands || "none"}`,
        ].join("\n"),
      },
      {
        name: "⚙️ Config",
        value: [
          `Poll: ${durationLabel(config.pollIntervalMs)} | Timeout: ${durationLabel(config.metricsTimeoutMs)}`,
          `Retry: ${compactNumber(config.metricsRetryAttempts)} attempts @ base ${durationLabel(config.metricsRetryBaseMs)}`,
          `Realtime points: ${compactNumber(config.realtimeHistoryPoints)}`,
        ].join("\n"),
      }
    )
    .setTimestamp(new Date());

  if (fetch.lastError) {
    embed.addFields({
      name: "🧯 Last Fetch Error",
      value: fetch.lastError,
    });
  }

  if (loop.lastError) {
    embed.addFields({
      name: "🧯 Last Loop Error",
      value: loop.lastError,
    });
  }

  return embed;
}

async function registerSlashCommands() {
  const rest = new REST({ version: "10" }).setToken(config.botToken);
  await rest.put(Routes.applicationGuildCommands(config.clientId, config.guildId), {
    body: slashCommands.map((command) => command.toJSON()),
  });
}

function isWritableTextChannel(channel) {
  return (
    channel &&
    (channel.type === ChannelType.GuildText || channel.type === ChannelType.GuildAnnouncement) &&
    "messages" in channel
  );
}

let runtimeStatusMessageId = config.statusMessageId;

async function ensureStatusMessage(client) {
  const channel = await client.channels.fetch(config.statusChannelId);
  if (!isWritableTextChannel(channel)) {
    throw new Error("Configured status channel is not a writable text channel.");
  }

  if (runtimeStatusMessageId) {
    try {
      const existing = await channel.messages.fetch(runtimeStatusMessageId);
      if (existing) return existing;
    } catch {
      runtimeStatusMessageId = "";
    }
  }

  const pinned = await channel.messages.fetchPinned().catch(() => null);
  const knownPinned = pinned?.find(
    (message) => message.author?.id === client.user?.id && message.content.startsWith(STATUS_MARKER)
  );

  if (knownPinned) {
    runtimeStatusMessageId = knownPinned.id;
    return knownPinned;
  }

  const recent = await channel.messages.fetch({ limit: 25 });
  const known = recent.find(
    (message) => message.author?.id === client.user?.id && message.content.startsWith(STATUS_MARKER)
  );

  if (known) {
    runtimeStatusMessageId = known.id;
    return known;
  }

  const created = await channel.send(`${STATUS_MARKER}\nInitializing realtime status board...`);
  runtimeStatusMessageId = created.id;

  try {
    await created.pin("Realtime ops status board");
  } catch {
    // Pinning is optional; continue even without pin permission.
  }

  return created;
}

async function updateStatusBoard(client) {
  const metrics = await fetchMetrics(config.defaultGraphDays);
  recordRealtimePoint(metrics);
  const message = await ensureStatusMessage(client);
  const statusEmbed = buildStatusEmbed(metrics);
  const realtimeEmbed = buildRealtimeEmbed(metrics);
  const components = buildNavigationComponents();

  await message.edit({
    content: `${STATUS_MARKER}\nLast update: ${new Date().toISOString()}`,
    embeds: [statusEmbed, realtimeEmbed],
    components,
  });
}

function scheduleStatusRefresh(client, delayMs = config.pollIntervalMs) {
  if (isShuttingDown) return;
  if (statusTimer) {
    clearTimeout(statusTimer);
    statusTimer = null;
  }

  nextStatusRunAt = Date.now() + delayMs;

  statusTimer = setTimeout(() => {
    void runStatusRefresh(client);
  }, delayMs);
}

async function runStatusRefresh(client) {
  if (isShuttingDown) return;

  if (statusUpdateInFlight) {
    runtimeStats.statusLoop.skipped += 1;
    scheduleStatusRefresh(client, Math.min(config.pollIntervalMs, 5_000));
    return;
  }

  const startedAt = Date.now();
  runtimeStats.statusLoop.runs += 1;
  runtimeStats.statusLoop.lastRunAt = startedAt;

  statusUpdateInFlight = true;
  try {
    await updateStatusBoard(client);
    runtimeStats.statusLoop.successes += 1;
    runtimeStats.statusLoop.consecutiveFailures = 0;
    runtimeStats.statusLoop.lastSuccessAt = Date.now();
    runtimeStats.statusLoop.lastDurationMs = Date.now() - startedAt;
    runtimeStats.statusLoop.lastError = "";
  } catch (error) {
    runtimeStats.statusLoop.failures += 1;
    runtimeStats.statusLoop.consecutiveFailures += 1;
    runtimeStats.statusLoop.lastFailureAt = Date.now();
    runtimeStats.statusLoop.lastDurationMs = Date.now() - startedAt;
    runtimeStats.statusLoop.lastError = String(error instanceof Error ? error.message : error || "unknown").slice(0, 220);
    logMetricsError("Status board update failed", error);
  } finally {
    statusUpdateInFlight = false;
    scheduleStatusRefresh(client, config.pollIntervalMs);
  }
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.once("clientReady", async () => {
  console.log(`Discord bot logged in as ${client.user?.tag || "unknown"}`);

  if (config.metricsUrl.includes("vercel.app") && !config.vercelProtectionBypass) {
    console.warn("Metrics URL targets Vercel and no VERCEL_PROTECTION_BYPASS is set. Protected deployments may return checkpoint pages.");
  }

  try {
    await registerSlashCommands();
    console.log("Slash commands registered in guild scope.");
  } catch (error) {
    console.error("Failed to register slash commands", error);
  }

  try {
    await updateStatusBoard(client);
    console.log("Initial status board update complete.");
  } catch (error) {
    logMetricsError("Initial status board update failed", error);
  }

  scheduleStatusRefresh(client, config.pollIntervalMs);
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (!memberHasOwnerRole(interaction)) {
    await interaction.reply({
      flags: MessageFlags.Ephemeral,
      content: "You do not have permission to use this bot command.",
    });
    return;
  }

  trackCommandUsage(interaction.commandName);

  try {
    if (interaction.commandName === "bot-health") {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      await interaction.editReply({
        embeds: [buildBotHealthEmbed()],
        components: buildNavigationComponents(),
      });
      return;
    }

    if (interaction.commandName === "status") {
      await interaction.deferReply();
      const metrics = await fetchMetrics(config.defaultGraphDays);
      recordRealtimePoint(metrics);
      await interaction.editReply({
        embeds: [buildStatusEmbed(metrics), buildRealtimeEmbed(metrics)],
        components: buildNavigationComponents(),
      });
      return;
    }

    if (interaction.commandName === "queue") {
      await interaction.deferReply();
      const metrics = await fetchMetrics(config.defaultGraphDays);
      await interaction.editReply({ embeds: [buildQueueEmbed(metrics)], components: buildNavigationComponents() });
      return;
    }

    if (interaction.commandName === "webhook-health") {
      await interaction.deferReply();
      const metrics = await fetchMetrics(config.defaultGraphDays);
      await interaction.editReply({
        embeds: [buildWebhookHealthEmbed(metrics)],
        components: buildNavigationComponents(),
      });
      return;
    }

    if (interaction.commandName === "graph") {
      const days = interaction.options.getInteger("days") || config.defaultGraphDays;
      await interaction.deferReply();
      const metrics = await fetchMetrics(days);
      await interaction.editReply({ embeds: [buildGraphEmbed(metrics, days)], components: buildNavigationComponents() });
      return;
    }

    await interaction.reply({
      flags: MessageFlags.Ephemeral,
      content: "Command not implemented.",
    });
  } catch (error) {
    logMetricsError("Interaction failed", error);
    const message = metricsErrorHint(error);
    const errorEmbed = buildErrorEmbed(message);

    if (interaction.deferred || interaction.replied) {
      await interaction.editReply({ content: "", embeds: [errorEmbed] });
      return;
    }

    await interaction.reply({ flags: MessageFlags.Ephemeral, embeds: [errorEmbed] });
  }
});

client.on("error", (error) => {
  console.error("Discord client error", error);
});

client.on("shardError", (error) => {
  console.error("Discord shard error", error);
});

async function shutdown(signal, exitCode = 0) {
  if (shutdownStarted) return;
  shutdownStarted = true;
  isShuttingDown = true;

  console.log(`Received ${signal}, shutting down Discord bot...`);

  if (statusTimer) {
    clearTimeout(statusTimer);
    statusTimer = null;
  }
  nextStatusRunAt = 0;

  try {
    await client.destroy();
  } catch {
    // Ignore shutdown errors.
  }

  process.exit(exitCode);
}

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception", error);
  void shutdown("uncaughtException", 1);
});

client.login(config.botToken).catch((error) => {
  console.error("Discord login failed", error);
  process.exit(1);
});
