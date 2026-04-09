import { EmbedBuilder } from "discord.js";
import { compactNumber, statusColor, statusIcon, statusLabel } from "../helpers.ts";
import { channelDisplayName, footerFor, formatBox, withBranding } from "./common.ts";

export function buildWebhookHealthEmbed(metrics: any, config: any, variant = "command"): any {
  const channels = metrics?.webhookHealth?.channels || {};

  const channelFields = Object.entries(channels).map(([name, value]) => {
    const row = value || {};
    return {
      name: channelDisplayName(name),
      value: formatBox([
        `Status      : ${statusIcon((row as any).status)} ${statusLabel((row as any).status)}`,
        `Attempts    : ${compactNumber((row as any).attempts)}`,
        `Successes   : ${compactNumber((row as any).successes)}`,
        `Failures    : ${compactNumber((row as any).failures)}`,
        `Success rate: ${(row as any).successRate === null ? "n/a" : `${Number((row as any).successRate * 100).toFixed(2)}%`}`,
      ]),
    };
  });

  const embed = new EmbedBuilder()
    .setTitle("🔔 Webhook Delivery Health")
    .setColor(statusColor(metrics?.webhookHealth?.overallStatus))
    .setDescription(
      formatBox([
        `Overall: ${statusIcon(metrics?.webhookHealth?.overallStatus)} ${statusLabel(metrics?.webhookHealth?.overallStatus)}`,
        `Window : ${compactNumber(metrics?.webhookHealth?.windowHours || 0)}h`,
      ])
    )
    .addFields(channelFields.length > 0 ? channelFields : [{ name: "Channels", value: formatBox("No channel data") }])
    .setFooter({ text: footerFor(variant, "Delivery") })
    .setTimestamp(new Date(metrics?.generatedAt || Date.now()));

  return withBranding(embed, config);
}
