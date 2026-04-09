import type { CommandDeps, CommandInteraction } from "../types.ts";
import { componentsForCommand, deferByCommandPolicy } from "../reply-policy.ts";

export async function handleBotHealthCommand(interaction: CommandInteraction, deps: CommandDeps) {
  const { state, config, buildBotHealthEmbed } = deps;

  await deferByCommandPolicy(interaction, deps);
  await interaction.editReply({
    embeds: [buildBotHealthEmbed(state, config)],
    components: componentsForCommand(interaction.commandName, deps),
  });
}
