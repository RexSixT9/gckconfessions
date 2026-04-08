import "dotenv/config";

import { Client, GatewayIntentBits, MessageFlags } from "discord.js";
import { slashCommands } from "./bot/commands.mjs";
import { buildConfig } from "./bot/config.mjs";
import { STATUS_MARKER } from "./bot/constants.mjs";
import {
  buildBotHealthEmbed,
  buildErrorEmbed,
  buildNavigationComponents,
  buildQueueEmbed,
  buildStatusEmbed,
  buildWebhookHealthEmbed,
  metricsErrorHint,
} from "./bot/embeds.mjs";
import { memberHasOwnerRole, isWritableTextChannel, registerSlashCommands } from "./bot/discord-runtime.mjs";
import { fetchMetrics } from "./bot/metrics-client.mjs";
import { createRuntimeState, logMetricsError, trackCommandUsage } from "./bot/runtime-state.mjs";

const config = buildConfig();
const state = createRuntimeState(config);

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

function isUnknownMessageError(error) {
  const code = Number(error?.code ?? error?.rawError?.code ?? 0);
  return code === 10008;
}

function isStatusBoardMessage(message) {
  if (!message || message.author?.id !== client.user?.id) {
    return false;
  }

  const primaryEmbed = message.embeds?.[0];
  const footerText = primaryEmbed?.footer?.text || "";

  return footerText.includes("Status Board") || message.content.startsWith(STATUS_MARKER);
}

async function ensureStatusMessage(createPayload) {
  const channel = await client.channels.fetch(config.statusChannelId);
  if (!isWritableTextChannel(channel)) {
    throw new Error("Configured status channel is not a writable text channel.");
  }

  if (state.runtimeStatusMessageId) {
    try {
      const existing = await channel.messages.fetch(state.runtimeStatusMessageId);
      if (existing) return existing;
    } catch {
      state.runtimeStatusMessageId = "";
    }
  }

  const pinned = await channel.messages.fetchPins().catch(() => null);
  const pinnedMessages =
    (pinned && typeof pinned.find === "function" ? pinned : null) ||
    (Array.isArray(pinned) ? pinned : null) ||
    (pinned?.messages && typeof pinned.messages.find === "function" ? pinned.messages : null) ||
    (pinned?.items && typeof pinned.items.find === "function" ? pinned.items : null);

  const knownPinned = pinnedMessages?.find((message) => isStatusBoardMessage(message));

  if (knownPinned) {
    state.runtimeStatusMessageId = knownPinned.id;
    return knownPinned;
  }

  const recent = await channel.messages.fetch({ limit: 25 });
  const known = recent.find((message) => isStatusBoardMessage(message));

  if (known) {
    state.runtimeStatusMessageId = known.id;
    return known;
  }

  const created = await channel.send(createPayload ?? { content: "Initializing status board..." });
  state.runtimeStatusMessageId = created.id;

  return created;
}

async function updateStatusBoard() {
  const metrics = await fetchMetrics(config, state, config.defaultGraphDays);
  const payload = {
    embeds: [buildStatusEmbed(metrics, config, "board")],
    components: buildNavigationComponents(config),
  };
  const editPayload = {
    content: null,
    ...payload,
  };

  const message = await ensureStatusMessage(payload);
  try {
    await message.edit(editPayload);
    return;
  } catch (error) {
    if (!isUnknownMessageError(error)) {
      throw error;
    }
  }

  // The board message was deleted between lookup and edit; rebuild state and recover.
  state.runtimeStatusMessageId = "";
  console.warn("Status board message disappeared (Discord 10008). Recreating board message.");

  const recoveredMessage = await ensureStatusMessage(payload);
  try {
    await recoveredMessage.edit(editPayload);
  } catch (error) {
    if (!isUnknownMessageError(error)) {
      throw error;
    }

    state.runtimeStatusMessageId = "";
    await ensureStatusMessage(payload);
  }
}

function scheduleStatusRefresh(delayMs = config.pollIntervalMs) {
  if (state.isShuttingDown) return;

  if (state.statusTimer) {
    clearTimeout(state.statusTimer);
    state.statusTimer = null;
  }

  state.nextStatusRunAt = Date.now() + delayMs;
  state.statusTimer = setTimeout(() => {
    void runStatusRefresh();
  }, delayMs);
}

async function runStatusRefresh() {
  if (state.isShuttingDown) return;

  if (state.statusUpdateInFlight) {
    state.runtimeStats.statusLoop.skipped += 1;
    scheduleStatusRefresh(Math.min(config.pollIntervalMs, 5_000));
    return;
  }

  const startedAt = Date.now();
  state.runtimeStats.statusLoop.runs += 1;
  state.runtimeStats.statusLoop.lastRunAt = startedAt;

  state.statusUpdateInFlight = true;
  try {
    await updateStatusBoard();
    state.runtimeStats.statusLoop.successes += 1;
    state.runtimeStats.statusLoop.consecutiveFailures = 0;
    state.runtimeStats.statusLoop.lastSuccessAt = Date.now();
    state.runtimeStats.statusLoop.lastDurationMs = Date.now() - startedAt;
    state.runtimeStats.statusLoop.lastError = "";
  } catch (error) {
    state.runtimeStats.statusLoop.failures += 1;
    state.runtimeStats.statusLoop.consecutiveFailures += 1;
    state.runtimeStats.statusLoop.lastFailureAt = Date.now();
    state.runtimeStats.statusLoop.lastDurationMs = Date.now() - startedAt;
    state.runtimeStats.statusLoop.lastError = String(error instanceof Error ? error.message : error || "unknown").slice(0, 220);
    logMetricsError(state, "Status board update failed", error);
  } finally {
    state.statusUpdateInFlight = false;
    scheduleStatusRefresh(config.pollIntervalMs);
  }
}

client.once("clientReady", async () => {
  console.log(`Discord bot logged in as ${client.user?.tag || "unknown"}`);
  console.log(`Status polling interval set to ${config.pollIntervalMs}ms.`);

  if (config.metricsUrl.includes("vercel.app") && !config.vercelProtectionBypass) {
    console.warn(
      "Metrics URL targets Vercel and no VERCEL_PROTECTION_BYPASS is set. Protected deployments may return checkpoint pages."
    );
  }

  try {
    await registerSlashCommands(config, slashCommands);
    console.log("Slash commands registered in guild scope.");
  } catch (error) {
    console.error("Failed to register slash commands", error);
  }

  try {
    await updateStatusBoard();
    console.log("Initial status board update complete.");
  } catch (error) {
    logMetricsError(state, "Initial status board update failed", error);
  }

  scheduleStatusRefresh(config.pollIntervalMs);
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (!memberHasOwnerRole(interaction, config.ownerRoleId)) {
    await interaction.reply({
      flags: MessageFlags.Ephemeral,
      content: "You do not have permission to use this bot command.",
    });
    return;
  }

  trackCommandUsage(state, interaction.commandName);

  try {
    if (interaction.commandName === "bot-health") {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      await interaction.editReply({
        embeds: [buildBotHealthEmbed(state, config)],
        components: buildNavigationComponents(config),
      });
      return;
    }

    if (interaction.commandName === "status") {
      await interaction.deferReply();
      const metrics = await fetchMetrics(config, state, config.defaultGraphDays);
      await interaction.editReply({
        embeds: [buildStatusEmbed(metrics, config, "command")],
        components: buildNavigationComponents(config),
      });
      return;
    }

    if (interaction.commandName === "queue") {
      await interaction.deferReply();
      const metrics = await fetchMetrics(config, state, config.defaultGraphDays);
      await interaction.editReply({
        embeds: [buildQueueEmbed(metrics, config)],
        components: buildNavigationComponents(config),
      });
      return;
    }

    if (interaction.commandName === "webhook-health") {
      await interaction.deferReply();
      const metrics = await fetchMetrics(config, state, config.defaultGraphDays);
      await interaction.editReply({
        embeds: [buildWebhookHealthEmbed(metrics, config)],
        components: buildNavigationComponents(config),
      });
      return;
    }

    await interaction.reply({
      flags: MessageFlags.Ephemeral,
      content: "Command not implemented.",
    });
  } catch (error) {
    logMetricsError(state, "Interaction failed", error);
    const errorEmbed = buildErrorEmbed(metricsErrorHint(error), config);

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
  if (state.shutdownStarted) return;
  state.shutdownStarted = true;
  state.isShuttingDown = true;

  console.log(`Received ${signal}, shutting down Discord bot...`);

  if (state.statusTimer) {
    clearTimeout(state.statusTimer);
    state.statusTimer = null;
  }
  state.nextStatusRunAt = 0;

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
