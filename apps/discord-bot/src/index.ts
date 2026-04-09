import "dotenv/config";

import { Client, GatewayIntentBits, MessageFlags } from "discord.js";
import { slashCommands } from "./bot/commands.ts";
import { buildConfig } from "./bot/config.ts";
import { STATUS_MARKER } from "./bot/constants.ts";
import {
  buildBotHealthEmbed,
  buildErrorEmbed,
  buildNavigationComponents,
  buildQueueEmbed,
  buildStatusEmbed,
  buildWebhookHealthEmbed,
  metricsErrorHint,
} from "./bot/embeds.ts";
import { memberHasOwnerRole, isWritableTextChannel, registerSlashCommands } from "./bot/discord-runtime.ts";
import { fetchMetrics } from "./bot/metrics-client.ts";
import { createRuntimeState, logMetricsError, trackCommandUsage } from "./bot/runtime-state.ts";
import { createStatusBoardLoop } from "./features/board/status-loop.ts";
import { routeCommandInteraction } from "./features/commands/router.ts";

const config = buildConfig();
const state = createRuntimeState(config);

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

const statusBoardLoop = createStatusBoardLoop({
  client,
  config,
  state,
  fetchMetrics,
  buildStatusEmbed,
  buildNavigationComponents,
  logMetricsError,
  isWritableTextChannel,
  statusMarker: STATUS_MARKER,
});

client.once("clientReady", async () => {
  console.log(`Discord bot logged in as ${client.user?.tag || "unknown"}`);
  console.log(`Status polling interval set to ${config.pollIntervalMs}ms.`);

  if (config.metricsUrl.includes("vercel.app") && !config.vercelProtectionBypass) {
    console.warn(
      "Metrics URL targets Vercel and no bypass secret is set (VERCEL_PROTECTION_BYPASS or VERCEL_AUTOMATION_BYPASS_SECRET). Protected deployments may return checkpoint pages."
    );
  }

  try {
    await registerSlashCommands(config, slashCommands);
    console.log("Slash commands registered in guild scope.");
  } catch (error) {
    console.error("Failed to register slash commands", error);
  }

  try {
    await statusBoardLoop.updateStatusBoard();
    console.log("Initial status board update complete.");
  } catch (error) {
    logMetricsError(state, "Initial status board update failed", error);
  }

  statusBoardLoop.scheduleStatusRefresh(config.pollIntervalMs);
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
    await routeCommandInteraction(interaction, {
      config,
      state,
      fetchMetrics,
      buildBotHealthEmbed,
      buildStatusEmbed,
      buildQueueEmbed,
      buildWebhookHealthEmbed,
      buildNavigationComponents,
    });
  } catch (error) {
    logMetricsError(state, "Interaction failed", error);
    const errorEmbed = buildErrorEmbed(metricsErrorHint(error), config);

    if (interaction.deferred || interaction.replied) {
      await interaction.editReply({ content: "", embeds: [errorEmbed], components: [] });
      return;
    }

    await interaction.reply({ flags: MessageFlags.Ephemeral, embeds: [errorEmbed], components: [] });
  }
});

client.on("error", (error) => {
  console.error("Discord client error", error);
});

client.on("shardError", (error) => {
  console.error("Discord shard error", error);
});

async function shutdown(signal: string, exitCode = 0) {
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
