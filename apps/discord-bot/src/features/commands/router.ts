import { MessageFlags } from "discord.js";
import type { CommandDeps, CommandHandler, CommandInteraction } from "./types.ts";
import { handleBotHealthCommand } from "./handlers/bot-health.ts";
import { handleQueueCommand } from "./handlers/queue.ts";
import { handleStatusCommand } from "./handlers/status.ts";
import { handleWebhookHealthCommand } from "./handlers/webhook-health.ts";

const COMMAND_HANDLERS: Record<string, CommandHandler> = {
  "bot-health": handleBotHealthCommand,
  status: handleStatusCommand,
  queue: handleQueueCommand,
  "webhook-health": handleWebhookHealthCommand,
};

export async function routeCommandInteraction(interaction: CommandInteraction, deps: CommandDeps) {
  const handler = COMMAND_HANDLERS[interaction.commandName];

  if (!handler) {
    await interaction.reply({
      flags: MessageFlags.Ephemeral,
      content: "Command not implemented.",
    });
    return;
  }

  await handler(interaction, deps);
}
