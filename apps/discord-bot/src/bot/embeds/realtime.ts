import { EmbedBuilder } from "discord.js";
import { compactNumber } from "../helpers.ts";
import { buildRealtimeQueueChartUrl } from "../charts.ts";
import { historyForChart } from "../runtime-state.ts";
import { formatBox, withBranding } from "./common.ts";

export function buildRealtimeEmbed(metrics: any, state: any, config: any): any {
  const points = historyForChart(state, config, metrics);
  const embed = withBranding(new EmbedBuilder(), config)
    .setTitle("📈 Realtime Queue Trend")
    .setColor(0x0b7285)
    .setDescription(`Tracking latest ${compactNumber(points.length)} board samples.`)
    .setTimestamp(new Date(metrics?.generatedAt || Date.now()));

  if (points.length < 2) {
    embed.addFields({
      name: "Graph Warmup",
      value: formatBox("Collecting datapoints. Graph appears after the next status refresh."),
    });
    return embed;
  }

  const chartUrl = buildRealtimeQueueChartUrl(points);
  if (!chartUrl) {
    embed.addFields({
      name: "Graph Skipped",
      value: formatBox("Chart URL exceeded embed limits. Reduce BOT_REALTIME_HISTORY_POINTS."),
    });
    return embed;
  }

  embed.setImage(chartUrl);
  return embed;
}
