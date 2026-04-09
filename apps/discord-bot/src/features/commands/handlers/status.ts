import type { CommandDeps, CommandInteraction } from "../types.ts";
import { componentsForCommand, deferByCommandPolicy } from "../reply-policy.ts";

export async function handleStatusCommand(interaction: CommandInteraction, deps: CommandDeps) {
  const { config, state, fetchMetrics, buildStatusEmbed } = deps;

  await deferByCommandPolicy(interaction, deps);
  const metrics = await fetchMetrics(config, state, config.defaultGraphDays);
  await interaction.editReply({
    embeds: [buildStatusEmbed(metrics, config, "command")],
    components: componentsForCommand(interaction.commandName, deps),
  });
}
