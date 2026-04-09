import type { CommandDeps, CommandInteraction } from "../types.ts";
import { componentsForCommand, deferByCommandPolicy } from "../reply-policy.ts";

export async function handleQueueCommand(interaction: CommandInteraction, deps: CommandDeps) {
  const { config, state, fetchMetrics, buildQueueEmbed } = deps;

  await deferByCommandPolicy(interaction, deps);
  const metrics = await fetchMetrics(config, state, config.defaultGraphDays);
  await interaction.editReply({
    embeds: [buildQueueEmbed(metrics, config)],
    components: componentsForCommand(interaction.commandName, deps),
  });
}
