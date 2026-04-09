import type { CommandDeps, CommandInteraction } from "../types.ts";

export async function handleWebhookHealthCommand(interaction: CommandInteraction, deps: CommandDeps) {
  const { config, state, fetchMetrics, buildWebhookHealthEmbed, buildNavigationComponents } = deps;

  await interaction.deferReply();
  const metrics = await fetchMetrics(config, state, config.defaultGraphDays);
  await interaction.editReply({
    embeds: [buildWebhookHealthEmbed(metrics, config)],
    components: buildNavigationComponents(config),
  });
}
