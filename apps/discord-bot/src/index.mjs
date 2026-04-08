import {
  ChannelType,
  Client,
  EmbedBuilder,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
} from "discord.js";

const STATUS_MARKER = "[gck-ops-status-board]";

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function optionalInt(name, fallback, min, max) {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;

  const parsed = Number(raw);
  if (!Number.isInteger(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

const config = {
  botToken: requiredEnv("DISCORD_BOT_TOKEN"),
  clientId: requiredEnv("DISCORD_CLIENT_ID"),
  guildId: requiredEnv("DISCORD_GUILD_ID"),
  ownerRoleId: requiredEnv("DISCORD_OWNER_ROLE_ID"),
  statusChannelId: requiredEnv("DISCORD_STATUS_CHANNEL_ID"),
  statusMessageId: process.env.DISCORD_STATUS_MESSAGE_ID?.trim() || "",
  metricsUrl: requiredEnv("DISCORD_METRICS_URL"),
  metricsSecret: requiredEnv("DISCORD_METRICS_SECRET"),
  pollIntervalMs: optionalInt("BOT_POLL_INTERVAL_MS", 20_000, 10_000, 120_000),
  defaultGraphDays: optionalInt("BOT_DEFAULT_GRAPH_DAYS", 7, 1, 30),
  webhookWindowHours: optionalInt("BOT_WEBHOOK_WINDOW_HOURS", 24, 1, 168),
};

const slashCommands = [
  new SlashCommandBuilder().setName("status").setDescription("Show live API and site health.").setDMPermission(false),
  new SlashCommandBuilder().setName("queue").setDescription("Show confession queue totals.").setDMPermission(false),
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

function statusLabel(status) {
  const normalized = String(status || "unknown").toLowerCase();
  if (normalized === "healthy") return "HEALTHY";
  if (normalized === "degraded") return "DEGRADED";
  if (normalized === "down") return "DOWN";
  return "UNKNOWN";
}

function statusColor(status) {
  const normalized = String(status || "unknown").toLowerCase();
  if (normalized === "healthy") return 0x2f9e44;
  if (normalized === "degraded") return 0xf08c00;
  if (normalized === "down") return 0xe03131;
  return 0x495057;
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
  const url = new URL(config.metricsUrl);
  url.searchParams.set("days", String(days));
  url.searchParams.set("webhookHours", String(config.webhookWindowHours));

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "x-discord-metrics-secret": config.metricsSecret,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = (await response.text()).slice(0, 300);
    throw new Error(`Metrics fetch failed (${response.status}): ${body}`);
  }

  return response.json();
}

function buildStatusEmbed(metrics) {
  const health = metrics?.health || {};
  const queue = metrics?.queue || {};
  const api = health?.api || {};

  return new EmbedBuilder()
    .setTitle("GCK Ops Status")
    .setColor(statusColor(health?.overallStatus))
    .setDescription(`Overall: ${statusLabel(health?.overallStatus)}`)
    .addFields(
      {
        name: "API",
        value: [
          `Status: ${String(api.status || "unknown").toUpperCase()}`,
          `Uptime: ${compactNumber(api.uptimeSeconds || 0)}s`,
          `Env: ${api.environment || "unknown"}`,
        ].join("\n"),
        inline: true,
      },
      {
        name: "Queue",
        value: [
          `Pending: ${compactNumber(queue.pending)}`,
          `Approved: ${compactNumber(queue.approved)}`,
          `Rejected: ${compactNumber(queue.rejected)}`,
          `Published: ${compactNumber(queue.published)}`,
          `Total: ${compactNumber(queue.total)}`,
        ].join("\n"),
        inline: true,
      },
      {
        name: "Webhook Health",
        value: [
          `Overall: ${statusLabel(metrics?.webhookHealth?.overallStatus)}`,
          `Window: ${compactNumber(metrics?.webhookHealth?.windowHours || 0)}h`,
        ].join("\n"),
        inline: true,
      }
    )
    .setFooter({ text: `Schema v${metrics?.schemaVersion ?? 1}` })
    .setTimestamp(new Date(metrics?.generatedAt || Date.now()));
}

function buildQueueEmbed(metrics) {
  const queue = metrics?.queue || {};
  return new EmbedBuilder()
    .setTitle("Confession Queue Snapshot")
    .setColor(0x1c7ed6)
    .addFields(
      { name: "Pending", value: compactNumber(queue.pending), inline: true },
      { name: "Approved", value: compactNumber(queue.approved), inline: true },
      { name: "Rejected", value: compactNumber(queue.rejected), inline: true },
      { name: "Published", value: compactNumber(queue.published), inline: true },
      { name: "Total", value: compactNumber(queue.total), inline: true }
    )
    .setTimestamp(new Date(metrics?.generatedAt || Date.now()));
}

function buildWebhookHealthEmbed(metrics) {
  const channels = metrics?.webhookHealth?.channels || {};

  const channelLines = Object.entries(channels).map(([name, value]) => {
    const row = value || {};
    return [
      `Channel: ${name}`,
      `Status: ${statusLabel(row.status)}`,
      `Attempts: ${compactNumber(row.attempts)}`,
      `Successes: ${compactNumber(row.successes)}`,
      `Failures: ${compactNumber(row.failures)}`,
      `Success rate: ${row.successRate === null ? "n/a" : `${Number(row.successRate * 100).toFixed(2)}%`}`,
    ].join("\n");
  });

  return new EmbedBuilder()
    .setTitle("Webhook Delivery Health")
    .setColor(statusColor(metrics?.webhookHealth?.overallStatus))
    .setDescription(
      `Overall: ${statusLabel(metrics?.webhookHealth?.overallStatus)} | Window: ${compactNumber(metrics?.webhookHealth?.windowHours || 0)}h`
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
          backgroundColor: "#1c7ed6",
          borderColor: "#1c7ed6",
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
          tension: 0.25,
        },
      ],
    },
    options: {
      plugins: {
        legend: { display: true },
        title: {
          display: true,
          text: "Confessions per Day",
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { precision: 0 },
        },
      },
    },
  };

  return `https://quickchart.io/chart?width=1000&height=420&c=${encodeURIComponent(JSON.stringify(chartConfig))}`;
}

function buildGraphEmbed(metrics, days) {
  const daily = Array.isArray(metrics?.daily) ? metrics.daily : [];
  const totalSubmissions = daily.reduce((sum, point) => sum + Number(point.submissions || 0), 0);
  const totalPublished = daily.reduce((sum, point) => sum + Number(point.published || 0), 0);

  const embed = new EmbedBuilder()
    .setTitle(`Confession Graph (${days}d)`)
    .setColor(0x5f3dc4)
    .setDescription(
      `Submissions: ${compactNumber(totalSubmissions)} | Published: ${compactNumber(totalPublished)}`
    )
    .setTimestamp(new Date(metrics?.generatedAt || Date.now()));

  if (daily.length > 0) {
    embed.setImage(buildQuickChartUrl(daily));
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
  const message = await ensureStatusMessage(client);
  const embed = buildStatusEmbed(metrics);

  await message.edit({
    content: `${STATUS_MARKER}\nLast update: ${new Date().toISOString()}`,
    embeds: [embed],
  });
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

let statusInterval = null;

client.once("ready", async () => {
  console.log(`Discord bot logged in as ${client.user?.tag || "unknown"}`);

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
    console.error("Initial status board update failed", error);
  }

  statusInterval = setInterval(async () => {
    try {
      await updateStatusBoard(client);
    } catch (error) {
      console.error("Status board update failed", error);
    }
  }, config.pollIntervalMs);
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (!memberHasOwnerRole(interaction)) {
    await interaction.reply({
      ephemeral: true,
      content: "You do not have permission to use this bot command.",
    });
    return;
  }

  try {
    if (interaction.commandName === "status") {
      await interaction.deferReply({ ephemeral: false });
      const metrics = await fetchMetrics(config.defaultGraphDays);
      await interaction.editReply({ embeds: [buildStatusEmbed(metrics)] });
      return;
    }

    if (interaction.commandName === "queue") {
      await interaction.deferReply({ ephemeral: false });
      const metrics = await fetchMetrics(config.defaultGraphDays);
      await interaction.editReply({ embeds: [buildQueueEmbed(metrics)] });
      return;
    }

    if (interaction.commandName === "webhook-health") {
      await interaction.deferReply({ ephemeral: false });
      const metrics = await fetchMetrics(config.defaultGraphDays);
      await interaction.editReply({ embeds: [buildWebhookHealthEmbed(metrics)] });
      return;
    }

    if (interaction.commandName === "graph") {
      const days = interaction.options.getInteger("days") || config.defaultGraphDays;
      await interaction.deferReply({ ephemeral: false });
      const metrics = await fetchMetrics(days);
      await interaction.editReply({ embeds: [buildGraphEmbed(metrics, days)] });
      return;
    }

    await interaction.reply({
      ephemeral: true,
      content: "Command not implemented.",
    });
  } catch (error) {
    console.error("Interaction failed", error);
    const message = "Bot command failed. Check bot logs and metrics endpoint auth.";

    if (interaction.deferred || interaction.replied) {
      await interaction.editReply({ content: message, embeds: [] });
      return;
    }

    await interaction.reply({ ephemeral: true, content: message });
  }
});

async function shutdown(signal) {
  console.log(`Received ${signal}, shutting down Discord bot...`);

  if (statusInterval) {
    clearInterval(statusInterval);
    statusInterval = null;
  }

  try {
    await client.destroy();
  } catch {
    // Ignore shutdown errors.
  }

  process.exit(0);
}

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

client.login(config.botToken).catch((error) => {
  console.error("Discord login failed", error);
  process.exit(1);
});
