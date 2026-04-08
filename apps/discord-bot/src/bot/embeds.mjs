import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from "discord.js";
import {
  compactNumber,
  durationLabel,
  queueColor,
  queueIcon,
  sinceLabel,
  statusColor,
  statusIcon,
  statusLabel,
  untilLabel,
} from "./helpers.mjs";
import { buildQuickChartUrl, buildRealtimeQueueChartUrl } from "./charts.mjs";
import { historyForChart } from "./runtime-state.mjs";

function channelDisplayName(name) {
  if (name === "audit_discord") return "🧾 Audit Discord";
  if (name === "security_webhook") return "🛡️ Security Webhook";
  if (name === "security_email") return "📨 Security Email";
  return `🔹 ${name}`;
}

function nextRunLabel(state) {
  return untilLabel(state.nextStatusRunAt);
}

export function buildStatusEmbed(metrics) {
  const health = metrics?.health || {};
  const queue = metrics?.queue || {};
  const api = health?.api || {};
  const issues = Array.isArray(health?.issues) ? health.issues : [];
  const databaseStatus = health?.database?.status || "unknown";

  const embed = new EmbedBuilder()
    .setTitle("🛰️ GCK Ops Live Status")
    .setColor(statusColor(health?.overallStatus))
    .setDescription(`${statusIcon(health?.overallStatus)} Overall **${statusLabel(health?.overallStatus)}**`)
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

export function buildQueueEmbed(metrics) {
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

export function buildWebhookHealthEmbed(metrics) {
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

export function buildRealtimeEmbed(metrics, state, config) {
  const points = historyForChart(state, config, metrics);
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

export function buildGraphEmbed(metrics, days) {
  const daily = Array.isArray(metrics?.daily) ? metrics.daily : [];
  const totalSubmissions = daily.reduce((sum, point) => sum + Number(point.submissions || 0), 0);
  const totalPublished = daily.reduce((sum, point) => sum + Number(point.published || 0), 0);

  const embed = new EmbedBuilder()
    .setTitle(`📊 Confession Graph (${days}d)`)
    .setColor(0x0b7285)
    .setDescription(`📝 Submissions: ${compactNumber(totalSubmissions)} | 📣 Published: ${compactNumber(totalPublished)}`)
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

export function buildErrorEmbed(message) {
  return new EmbedBuilder()
    .setTitle("❌ Bot Command Failed")
    .setColor(0xe03131)
    .setDescription(message)
    .setTimestamp(new Date());
}

export function metricsErrorHint(error) {
  const text = String(error instanceof Error ? error.message : error || "");
  if (text.includes("401") || text.toLowerCase().includes("unauthorized")) {
    return "Metrics authentication failed. Verify DISCORD_METRICS_SECRET matches Vercel.";
  }
  if (text.includes("ECONNREFUSED") || text.toLowerCase().includes("refused connection")) {
    return "Metrics endpoint connection was refused. Ensure your app is running on DISCORD_METRICS_URL or point the bot to a live deployment.";
  }
  if (text.includes("ENOTFOUND") || text.includes("EAI_AGAIN") || text.toLowerCase().includes("host lookup failed")) {
    return "Metrics endpoint DNS lookup failed. Verify DISCORD_METRICS_URL host and network DNS resolution.";
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

export function buildNavigationComponents(config) {
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

export function buildBotHealthEmbed(state, config) {
  const fetch = state.runtimeStats.fetch;
  const loop = state.runtimeStats.statusLoop;
  const commands = state.runtimeStats.commands;

  const sortedCommands = Object.entries(commands.byName)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([name, count]) => `${name}: ${compactNumber(count)}`)
    .join("\n");

  const degraded = fetch.consecutiveFailures > 0 || loop.consecutiveFailures > 0;

  const embed = new EmbedBuilder()
    .setTitle("🩺 Bot Runtime Health")
    .setColor(degraded ? 0xf08c00 : 0x2f9e44)
    .setDescription(`${degraded ? "🟠" : "🟢"} Runtime is ${degraded ? "degraded" : "healthy"}.`)
    .addFields(
      {
        name: "⏱️ Runtime",
        value: [
          `Uptime: ${durationLabel(Date.now() - state.runtimeStats.startedAt)}`,
          `Shutting down: ${state.isShuttingDown ? "yes" : "no"}`,
          `Status in-flight: ${state.statusUpdateInFlight ? "yes" : "no"}`,
          `Next status run: ${nextRunLabel(state)}`,
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
          `Board message id: ${state.runtimeStatusMessageId || "not set"}`,
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
