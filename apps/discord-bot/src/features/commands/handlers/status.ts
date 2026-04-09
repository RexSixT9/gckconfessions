import type { CommandDeps, CommandInteraction } from "../types.ts";

export async function handleStatusCommand(interaction: CommandInteraction, deps: CommandDeps) {
  const { config, state, fetchMetrics, buildStatusEmbed, buildNavigationComponents } = deps;

  await interaction.deferReply();
  const metrics = await fetchMetrics(config, state, config.defaultGraphDays);
  await interaction.editReply({
    embeds: [buildStatusEmbed(metrics, config, "command")],
    components: buildNavigationComponents(config),
  });
}
