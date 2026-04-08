import * as Discord from "discord.js";

const { SlashCommandBuilder } = Discord;

function guildOnly(command) {
  if (typeof command.setContexts === "function" && Discord.InteractionContextType?.Guild) {
    command.setContexts(Discord.InteractionContextType.Guild);
  } else if (typeof command.setDMPermission === "function") {
    command.setDMPermission(false);
  }

  if (
    typeof command.setIntegrationTypes === "function" &&
    Discord.ApplicationIntegrationType?.GuildInstall
  ) {
    command.setIntegrationTypes(Discord.ApplicationIntegrationType.GuildInstall);
  }

  return command;
}

export const slashCommands = [
  guildOnly(new SlashCommandBuilder().setName("status").setDescription("Show live API and site health.")),
  guildOnly(new SlashCommandBuilder().setName("queue").setDescription("Show confession queue totals.")),
  guildOnly(new SlashCommandBuilder()
    .setName("bot-health")
    .setDescription("Show Discord bot runtime diagnostics.")),
  guildOnly(new SlashCommandBuilder()
    .setName("graph")
    .setDescription("Show confession metrics chart.")
    .addIntegerOption((option) =>
      option
        .setName("days")
        .setDescription("Days to include (1-30).")
        .setMinValue(1)
        .setMaxValue(30)
    )),
  guildOnly(new SlashCommandBuilder()
    .setName("webhook-health")
    .setDescription("Show webhook delivery health by channel.")),
];
