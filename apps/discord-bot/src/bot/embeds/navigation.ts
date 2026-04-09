import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

export function buildNavigationComponents(config: any): any[] {
  const buttons: ButtonBuilder[] = [];

  if (config.dashboardUrl) {
    buttons.push(
      new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel("Dashboard").setURL(config.dashboardUrl)
    );
  }

  if (config.transparencyUrl) {
    buttons.push(
      new ButtonBuilder()
        .setStyle(ButtonStyle.Link)
        .setLabel("Transparency")
        .setURL(config.transparencyUrl)
    );
  }

  if (buttons.length === 0) {
    return [];
  }

  return [new ActionRowBuilder<ButtonBuilder>().addComponents(...buttons)];
}
