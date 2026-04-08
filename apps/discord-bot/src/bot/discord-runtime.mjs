import { ChannelType, REST, Routes } from "discord.js";

export function memberHasOwnerRole(interaction, ownerRoleId) {
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

export function isWritableTextChannel(channel) {
  return (
    channel &&
    (channel.type === ChannelType.GuildText || channel.type === ChannelType.GuildAnnouncement) &&
    "messages" in channel
  );
}

export async function registerSlashCommands(config, slashCommands) {
  const rest = new REST({ version: "10" }).setToken(config.botToken);
  await rest.put(Routes.applicationGuildCommands(config.clientId, config.guildId), {
    body: slashCommands.map((command) => command.toJSON()),
  });
}
