import type { CommandDeps, CommandInteraction } from "../types.ts";

export async function handleQueueCommand(interaction: CommandInteraction, deps: CommandDeps) {
  const { config, state, fetchMetrics, buildQueueEmbed, buildNavigationComponents } = deps;

  await interaction.deferReply();
  const metrics = await fetchMetrics(config, state, config.defaultGraphDays);
  await interaction.editReply({
    embeds: [buildQueueEmbed(metrics, config)],
    components: buildNavigationComponents(config),
  });
}
