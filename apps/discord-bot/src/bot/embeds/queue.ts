import { EmbedBuilder } from "discord.js";
import { compactNumber, queueColor } from "../helpers.ts";
import { footerFor, formatBox, withBranding } from "./common.ts";

export function buildQueueEmbed(metrics: any, config: any, variant = "command"): any {
  const queue = metrics?.queue || {};
  const embed = new EmbedBuilder()
    .setTitle("📦 Confession Queue")
    .setColor(queueColor(queue))
    .addFields({
      name: "📦 QUEUE COUNTS",
      value: formatBox([
        `Pending  : ${compactNumber(queue.pending)}`,
        `Approved : ${compactNumber(queue.approved)}`,
        `Rejected : ${compactNumber(queue.rejected)}`,
        `Published: ${compactNumber(queue.published)}`,
        `Total    : ${compactNumber(queue.total)}`,
      ]),
    })
    .setDescription("Queue snapshot")
    .setFooter({ text: footerFor(variant, "Queue") })
    .setTimestamp(new Date(metrics?.generatedAt || Date.now()));

  return withBranding(embed, config);
}
