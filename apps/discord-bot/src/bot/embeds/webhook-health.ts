import { EmbedBuilder } from "discord.js";
import { compactNumber, statusColor, statusIcon, statusLabel } from "../helpers.ts";
import type { BotConfig } from "../config.ts";
import type { EmbedVariant, MetricsSnapshot, WebhookChannelMetrics } from "../types.ts";
import {
  channelDisplayName,
  footerFor,
  formatBox,
  safeDescription,
  safeField,
  withBranding,
} from "./common.ts";

const MAX_WEBHOOK_CHANNEL_FIELDS = 20;

export function buildWebhookHealthEmbed(
  metrics: MetricsSnapshot,
  config: BotConfig,
  variant: EmbedVariant = "command"
): EmbedBuilder {
  const channels = metrics?.webhookHealth?.channels || {};

  const rankedChannels = Object.entries(channels).sort((a, b) => {
    const left = (a[1] as WebhookChannelMetrics) || ({} as WebhookChannelMetrics);
    const right = (b[1] as WebhookChannelMetrics) || ({} as WebhookChannelMetrics);
    const byFailures = Number(right.failures || 0) - Number(left.failures || 0);
    if (byFailures !== 0) return byFailures;
    return Number(right.attempts || 0) - Number(left.attempts || 0);
  });

  const visibleChannels = rankedChannels.slice(0, MAX_WEBHOOK_CHANNEL_FIELDS);
  const hiddenChannels = Math.max(0, rankedChannels.length - visibleChannels.length);

  const channelFields = visibleChannels.map(([name, value]) => {
    const row = value || ({} as WebhookChannelMetrics);
    return safeField(
      channelDisplayName(name),
      formatBox([
        `Status      : ${statusIcon(row.status)} ${statusLabel(row.status)}`,
        `Attempts    : ${compactNumber(row.attempts)}`,
        `Successes   : ${compactNumber(row.successes)}`,
        `Failures    : ${compactNumber(row.failures)}`,
        `Success rate: ${row.successRate === null ? "n/a" : `${Number(row.successRate * 100).toFixed(2)}%`}`,
      ])
    );
  });

  const embed = new EmbedBuilder()
    .setTitle("🔔 Webhook Delivery Health")
    .setColor(statusColor(metrics?.webhookHealth?.overallStatus))
    .setDescription(
      safeDescription(
        formatBox([
        `Overall: ${statusIcon(metrics?.webhookHealth?.overallStatus)} ${statusLabel(metrics?.webhookHealth?.overallStatus)}`,
        `Window : ${compactNumber(metrics?.webhookHealth?.windowHours || 0)}h`,
        ])
      )
    )
    .addFields(
      channelFields.length > 0 ? channelFields : [safeField("Channels", formatBox("No channel data"))]
    )
    .setFooter({ text: footerFor(variant, "Delivery") })
    .setTimestamp(new Date(metrics?.generatedAt || Date.now()));

  if (hiddenChannels > 0) {
    embed.addFields(
      safeField(
        "Additional Channels",
        formatBox(`Showing top ${compactNumber(visibleChannels.length)}. ${compactNumber(hiddenChannels)} more channel(s) hidden.`)
      )
    );
  }

  return withBranding(embed, config);
}
