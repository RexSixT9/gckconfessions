import { SlashCommandBuilder } from "discord.js";

export const slashCommands = [
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
