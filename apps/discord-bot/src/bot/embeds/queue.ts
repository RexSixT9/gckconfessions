import { EmbedBuilder } from "discord.js";
import { compactNumber, queueColor } from "../helpers.ts";
import type { BotConfig } from "../config.ts";
import type { EmbedVariant, MetricsSnapshot } from "../types.ts";
import { footerFor, formatBox, safeDescription, safeField, withBranding } from "./common.ts";

export function buildQueueEmbed(
  metrics: MetricsSnapshot,
  config: BotConfig,
  variant: EmbedVariant = "command"
): EmbedBuilder {
  const queue = metrics?.queue || {};
  const embed = new EmbedBuilder()
    .setTitle("📦 Confession Queue")
    .setColor(queueColor(queue))
    .addFields(
      safeField(
        "📦 QUEUE COUNTS",
        formatBox([
          `Pending  : ${compactNumber(queue.pending)}`,
          `Approved : ${compactNumber(queue.approved)}`,
          `Rejected : ${compactNumber(queue.rejected)}`,
          `Published: ${compactNumber(queue.published)}`,
          `Total    : ${compactNumber(queue.total)}`,
        ])
      )
    )
    .setDescription(safeDescription("Queue snapshot"))
    .setFooter({ text: footerFor(variant, "Queue") })
    .setTimestamp(new Date(metrics?.generatedAt || Date.now()));

  return withBranding(embed, config);
}
