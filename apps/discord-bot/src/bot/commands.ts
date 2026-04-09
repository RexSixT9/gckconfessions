import * as Discord from "discord.js";

const { SlashCommandBuilder } = Discord;
const interactionContextType = (Discord as any).InteractionContextType;
const applicationIntegrationType = (Discord as any).ApplicationIntegrationType;

function guildOnly(command: any): any {
  if (typeof command.setContexts === "function" && interactionContextType?.Guild != null) {
    command.setContexts(interactionContextType.Guild);
  } else if (typeof command.setDMPermission === "function") {
    command.setDMPermission(false);
  }

  if (typeof command.setIntegrationTypes === "function" && applicationIntegrationType?.GuildInstall != null) {
    command.setIntegrationTypes(applicationIntegrationType.GuildInstall);
  }

  return command;
}

export const slashCommands = [
  guildOnly(new SlashCommandBuilder().setName("status").setDescription("Show live API and site health.")),
  guildOnly(new SlashCommandBuilder().setName("queue").setDescription("Show confession queue totals.")),
  guildOnly(new SlashCommandBuilder().setName("bot-health").setDescription("Show Discord bot runtime diagnostics.")),
  guildOnly(
    new SlashCommandBuilder().setName("webhook-health").setDescription("Show webhook delivery health by channel.")
  ),
];
