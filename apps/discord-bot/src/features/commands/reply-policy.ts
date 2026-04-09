import { MessageFlags } from "discord.js";
import type { CommandDeps, CommandInteraction } from "./types.ts";

export function isEphemeralCommand(commandName: string, deps: CommandDeps): boolean {
  const normalized = String(commandName || "").trim().toLowerCase();
  if (!normalized) return false;

  const publicCommands = Array.isArray(deps.config.publicCommands)
    ? deps.config.publicCommands
    : ["status", "queue", "webhook-health"];
  const ephemeralCommands = Array.isArray(deps.config.ephemeralCommands)
    ? deps.config.ephemeralCommands
    : ["bot-health"];

  if (publicCommands.includes(normalized)) {
    return false;
  }

  if (ephemeralCommands.includes(normalized)) {
    return true;
  }

  return false;
}

export async function deferByCommandPolicy(
  interaction: CommandInteraction,
  deps: CommandDeps
): Promise<void> {
  if (isEphemeralCommand(interaction.commandName, deps)) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    return;
  }

  await interaction.deferReply();
}

export function componentsForCommand(commandName: string, deps: CommandDeps) {
  if (isEphemeralCommand(commandName, deps)) {
    return [];
  }

  return deps.buildNavigationComponents(deps.config);
}
