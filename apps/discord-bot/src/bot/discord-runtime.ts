import { ChannelType, REST, Routes } from "discord.js";

export function memberHasOwnerRole(interaction: any, ownerRoleId: string): boolean {
  if (!ownerRoleId) return false;

  const member = interaction.member;
  if (!member) return false;

  const roles = member.roles;
  if (Array.isArray(roles)) {
    return roles.includes(ownerRoleId);
  }

  if (roles && roles.cache) {
    return roles.cache.has(ownerRoleId);
  }

  return false;
}

export function isWritableTextChannel(channel: any): boolean {
  return (
    channel &&
    (channel.type === ChannelType.GuildText || channel.type === ChannelType.GuildAnnouncement) &&
    "messages" in channel
  );
}

export async function registerSlashCommands(config: any, slashCommands: any[]): Promise<void> {
  const rest = new REST({ version: "10" }).setToken(config.botToken);
  await rest.put(Routes.applicationGuildCommands(config.clientId, config.guildId), {
    body: slashCommands.map((command) => command.toJSON()),
  });
}
