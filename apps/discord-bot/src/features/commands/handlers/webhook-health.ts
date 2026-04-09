import type { CommandDeps, CommandInteraction } from "../types.ts";
import { componentsForCommand, deferByCommandPolicy } from "../reply-policy.ts";

export async function handleWebhookHealthCommand(interaction: CommandInteraction, deps: CommandDeps) {
  const { config, state, fetchMetrics, buildWebhookHealthEmbed } = deps;

  await deferByCommandPolicy(interaction, deps);
  const metrics = await fetchMetrics(config, state, config.defaultGraphDays);
  await interaction.editReply({
    embeds: [buildWebhookHealthEmbed(metrics, config)],
    components: componentsForCommand(interaction.commandName, deps),
  });
}
