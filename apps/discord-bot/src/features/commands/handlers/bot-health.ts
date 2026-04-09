import type { CommandDeps, CommandInteraction } from "../types.ts";

export async function handleBotHealthCommand(interaction: CommandInteraction, deps: CommandDeps) {
  const { state, config, buildBotHealthEmbed, buildNavigationComponents } = deps;

  await interaction.deferReply();
  await interaction.editReply({
    embeds: [buildBotHealthEmbed(state, config)],
    components: buildNavigationComponents(config),
  });
}
