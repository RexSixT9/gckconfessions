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
  sinceLabel,
  statusColor,
  statusIcon,
  statusLabel,
  untilLabel,
} from "./helpers.mjs";
import { buildQuickChartUrl, buildRealtimeQueueChartUrl } from "./charts.mjs";
import { historyForChart } from "./runtime-state.mjs";

function channelDisplayName(name) {
  if (name === "audit_discord") return "Audit Discord";
  if (name === "security_webhook") return "Security Webhook";
  if (name === "security_email") return "Security Email";
  return String(name || "unknown").replace(/_/g, " ");
}

function formatBox(lines) {
  const content = Array.isArray(lines) ? lines.join("\n") : String(lines || "");
  return `\`\`\`txt\n${content}\n\`\`\``;
}

function withBranding(embed, config) {
  if (config?.headerThumbnailUrl) {
    embed.setThumbnail(config.headerThumbnailUrl);
  }
  return embed;
}

function nextRunLabel(state) {
  return untilLabel(state.nextStatusRunAt);
}

function footerFor(variant, section) {
  if (variant === "board") {
    return "GCK Confessions • Live Status";
  }
  return `GCK Confessions • ${section}`;
}

export function buildStatusEmbed(metrics, config, variant = "command") {
  const health = metrics?.health || {};
  const queue = metrics?.queue || {};
  const daily = Array.isArray(metrics?.daily) ? metrics.daily : [];
  const latestDaily = daily.at(-1) || {};
  const dailySubmissions = Number(latestDaily.submissions || 0);
  const totalSubmissions = daily.reduce((sum, point) => sum + Number(point.submissions || 0), 0);
  const averageSubmissions = daily.length > 0 ? Math.round(totalSubmissions / daily.length) : 0;
  const chartUrl = daily.length > 0 ? buildQuickChartUrl(daily) : "";
  const apiStatus = health?.api?.status || "unknown";
  const databaseStatus = health?.database?.status || "unknown";
  const deliveryStatus = metrics?.webhookHealth?.overallStatus || "unknown";
  const healthColor = statusColor(health?.overallStatus);
  const boardColor = healthColor === 0x2f9e44 ? 0x221433 : healthColor;

  const embed = new EmbedBuilder()
    .setTitle("GCK CONFESSIONS")
    .setColor(boardColor)
    .setDescription("Live status board")
    .addFields(
      {
        name: "🩺 STATUS",
        value: formatBox([
          `Overall : ${statusIcon(health?.overallStatus)} ${statusLabel(health?.overallStatus)}`,
          `API     : ${statusIcon(apiStatus)} ${statusLabel(apiStatus)}`,
          `DB      : ${statusIcon(databaseStatus)} ${statusLabel(databaseStatus)}`,
        ]),
        inline: false,
      },
      {
        name: "📝 DAILY SUBMISSIONS",
        value: formatBox([
          `Today   : ${compactNumber(dailySubmissions)}`,
          `Avg/day : ${compactNumber(averageSubmissions)}`,
          `Window  : ${compactNumber(totalSubmissions)} (${compactNumber(daily.length)}d)`,
        ]),
        inline: false,
      },
      {
        name: "🔔 DELIVERY",
        value: formatBox([
          `Delivery: ${statusIcon(deliveryStatus)} ${statusLabel(deliveryStatus)}`,
          `Window  : ${compactNumber(metrics?.webhookHealth?.windowHours || 0)}h`,
        ]),
        inline: false,
      },
      {
        name: "📦 QUEUE",
        value: formatBox([
          `Pending  : ${compactNumber(queue.pending)}`,
          `Approved : ${compactNumber(queue.approved)}`,
          `Rejected : ${compactNumber(queue.rejected)}`,
          `Published: ${compactNumber(queue.published)}`,
          `Total    : ${compactNumber(queue.total)}`,
        ]),
        inline: false,
      }
    )
    .setFooter({ text: footerFor(variant, "Status") })
    .setTimestamp(new Date(metrics?.generatedAt || Date.now()));

  if (chartUrl) {
    embed.setImage(chartUrl);
  } else if (daily.length === 0) {
    embed.addFields({
      name: "📈 TREND",
      value: formatBox("No confession data available for the selected window."),
      inline: false,
    });
  } else {
    embed.addFields({
      name: "📈 TREND",
      value: formatBox("Chart URL exceeded embed limits. Reduce BOT_DEFAULT_GRAPH_DAYS."),
      inline: false,
    });
  }

  return withBranding(embed, config);
}

export function buildQueueEmbed(metrics, config, variant = "command") {
  const queue = metrics?.queue || {};
  const embed = new EmbedBuilder()
    .setTitle("📦 Confession Queue")
    .setColor(queueColor(queue))
    .addFields(
      {
        name: "📦 QUEUE COUNTS",
        value: formatBox([
          `Pending  : ${compactNumber(queue.pending)}`,
          `Approved : ${compactNumber(queue.approved)}`,
          `Rejected : ${compactNumber(queue.rejected)}`,
          `Published: ${compactNumber(queue.published)}`,
          `Total    : ${compactNumber(queue.total)}`,
        ]),
      }
    )
    .setDescription("Queue snapshot")
    .setFooter({ text: footerFor(variant, "Queue") })
    .setTimestamp(new Date(metrics?.generatedAt || Date.now()));

  return withBranding(embed, config);
}

export function buildWebhookHealthEmbed(metrics, config, variant = "command") {
  const channels = metrics?.webhookHealth?.channels || {};

  const channelFields = Object.entries(channels).map(([name, value]) => {
    const row = value || {};
    return {
      name: channelDisplayName(name),
      value: formatBox([
        `Status      : ${statusIcon(row.status)} ${statusLabel(row.status)}`,
        `Attempts    : ${compactNumber(row.attempts)}`,
        `Successes   : ${compactNumber(row.successes)}`,
        `Failures    : ${compactNumber(row.failures)}`,
        `Success rate: ${row.successRate === null ? "n/a" : `${Number(row.successRate * 100).toFixed(2)}%`}`,
      ]),
    };
  });

  const embed = new EmbedBuilder()
    .setTitle("🔔 Webhook Delivery Health")
    .setColor(statusColor(metrics?.webhookHealth?.overallStatus))
    .setDescription(formatBox([
      `Overall: ${statusIcon(metrics?.webhookHealth?.overallStatus)} ${statusLabel(metrics?.webhookHealth?.overallStatus)}`,
      `Window : ${compactNumber(metrics?.webhookHealth?.windowHours || 0)}h`,
    ]))
    .addFields(channelFields.length > 0 ? channelFields : [{ name: "Channels", value: formatBox("No channel data") }])
    .setFooter({ text: footerFor(variant, "Delivery") })
    .setTimestamp(new Date(metrics?.generatedAt || Date.now()));

  return withBranding(embed, config);
}

export function buildRealtimeEmbed(metrics, state, config) {
  const points = historyForChart(state, config, metrics);
  const embed = withBranding(new EmbedBuilder(), config)
    .setTitle("📈 Realtime Queue Trend")
    .setColor(0x0b7285)
    .setDescription(`Tracking latest ${compactNumber(points.length)} board samples.`)
    .setTimestamp(new Date(metrics?.generatedAt || Date.now()));

  if (points.length < 2) {
    embed.addFields({
      name: "Graph Warmup",
      value: formatBox("Collecting datapoints. Graph appears after the next status refresh."),
    });
    return embed;
  }

  const chartUrl = buildRealtimeQueueChartUrl(points);
  if (!chartUrl) {
    embed.addFields({
      name: "Graph Skipped",
      value: formatBox("Chart URL exceeded embed limits. Reduce BOT_REALTIME_HISTORY_POINTS."),
    });
    return embed;
  }

  embed.setImage(chartUrl);
  return embed;
}

export function buildGraphEmbed(metrics, days, config, variant = "command") {
  const daily = Array.isArray(metrics?.daily) ? metrics.daily : [];
  const totalSubmissions = daily.reduce((sum, point) => sum + Number(point.submissions || 0), 0);

  const embed = new EmbedBuilder()
    .setTitle(`📈 Confession Submissions Trend (${days}d)`)
    .setColor(0x5b21b6)
    .setDescription(formatBox([
      `Daily submissions total: ${compactNumber(totalSubmissions)}`,
      `Window: ${compactNumber(days)}d`,
    ]))
    .setFooter({ text: footerFor(variant, "Submissions") })
    .setTimestamp(new Date(metrics?.generatedAt || Date.now()));

  if (daily.length > 0) {
    const chartUrl = buildQuickChartUrl(daily);
    if (chartUrl) {
      embed.setImage(chartUrl);
    } else {
      embed.addFields({
        name: "Chart Skipped",
        value: formatBox("Chart URL exceeded embed limits. Reduce BOT_DEFAULT_GRAPH_DAYS."),
      });
    }
  } else {
    embed.addFields({
      name: "No Data",
      value: formatBox("No confession data available for the selected window."),
    });
  }

  return withBranding(embed, config);
}

export function buildErrorEmbed(message, config) {
  const embed = new EmbedBuilder()
    .setTitle("⛔ Command Failed")
    .setColor(0xe03131)
    .setDescription(formatBox(message))
    .setFooter({ text: footerFor("command", "Error") })
    .setTimestamp(new Date());

  return withBranding(embed, config);
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
    return "Vercel security checkpoint blocked bot access. Configure VERCEL_PROTECTION_BYPASS (use your VERCEL_AUTOMATION_BYPASS_SECRET value).";
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
        .setLabel("Dashboard")
        .setURL(config.dashboardUrl)
    );
  }

  if (config.transparencyUrl) {
    buttons.push(
      new ButtonBuilder()
        .setStyle(ButtonStyle.Link)
        .setLabel("Transparency")
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
    .setDescription(`Runtime is ${degraded ? "DEGRADED" : "HEALTHY"}.`)
    .addFields(
      {
        name: "⏱️ Runtime",
        value: formatBox([
          `Uptime: ${durationLabel(Date.now() - state.runtimeStats.startedAt)}`,
          `Shutting down: ${state.isShuttingDown ? "yes" : "no"}`,
          `Status in-flight: ${state.statusUpdateInFlight ? "yes" : "no"}`,
          `Next status run: ${nextRunLabel(state)}`,
        ]),
      },
      {
        name: "🌐 Metrics",
        value: formatBox([
          `Total: ${compactNumber(fetch.total)} (ok ${compactNumber(fetch.successes)}, fail ${compactNumber(fetch.failures)})`,
          `Retries: ${compactNumber(fetch.retries)} | Consecutive fail: ${compactNumber(fetch.consecutiveFailures)}`,
          `Last latency: ${durationLabel(fetch.lastDurationMs)}`,
          `Last success: ${sinceLabel(fetch.lastSuccessAt)} | Last fail: ${sinceLabel(fetch.lastFailureAt)}`,
        ]),
      },
      {
        name: "🔁 Status Loop",
        value: formatBox([
          `Runs: ${compactNumber(loop.runs)} (ok ${compactNumber(loop.successes)}, fail ${compactNumber(loop.failures)})`,
          `Skipped: ${compactNumber(loop.skipped)} | Consecutive fail: ${compactNumber(loop.consecutiveFailures)}`,
          `Last run: ${sinceLabel(loop.lastRunAt)} | Last duration: ${durationLabel(loop.lastDurationMs)}`,
          `Board message id: ${state.runtimeStatusMessageId || "not set"}`,
        ]),
      },
      {
        name: "⌨️ Commands",
        value: formatBox([
          `Total: ${compactNumber(commands.total)} | Last used: ${sinceLabel(commands.lastAt)}`,
          `Top commands:\n${sortedCommands || "none"}`,
        ]),
      },
      {
        name: "⚙️ Config",
        value: formatBox([
          `Poll: ${durationLabel(config.pollIntervalMs)} | Timeout: ${durationLabel(config.metricsTimeoutMs)}`,
          `Retry: ${compactNumber(config.metricsRetryAttempts)} attempts @ base ${durationLabel(config.metricsRetryBaseMs)}`,
          `Realtime points: ${compactNumber(config.realtimeHistoryPoints)}`,
        ]),
      }
    )
    .setFooter({ text: footerFor("command", "Bot Health") })
    .setTimestamp(new Date());

  if (fetch.lastError) {
    embed.addFields({
      name: "Last Fetch Error",
      value: formatBox(fetch.lastError),
    });
  }

  if (loop.lastError) {
    embed.addFields({
      name: "Last Loop Error",
      value: formatBox(loop.lastError),
    });
  }

  return withBranding(embed, config);
}
