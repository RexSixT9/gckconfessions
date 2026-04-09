import { EmbedBuilder } from "discord.js";
import { compactNumber } from "../helpers.ts";
import { buildQuickChartUrl } from "../charts.ts";
import { footerFor, formatBox, withBranding } from "./common.ts";

export function buildGraphEmbed(metrics: any, days: number, config: any, variant = "command"): any {
  const daily = Array.isArray(metrics?.daily) ? metrics.daily : [];
  const totalSubmissions = daily.reduce((sum: number, point: any) => sum + Number(point.submissions || 0), 0);

  const embed = new EmbedBuilder()
    .setTitle(`📈 Confession Submissions Trend (${days}d)`)
    .setColor(0x5b21b6)
    .setDescription(
      formatBox([
        `Daily submissions total: ${compactNumber(totalSubmissions)}`,
        `Window: ${compactNumber(days)}d`,
      ])
    )
    .setFooter({ text: footerFor(variant, "Submissions") })
    .setTimestamp(new Date(metrics?.generatedAt || Date.now()));

  if (daily.length > 0) {
    const chartUrl = buildQuickChartUrl(daily);
    if (chartUrl) {
      embed.setImage(chartUrl);
    } else {
      embed.addFields({
        name: "Chart Skipped",
        value: formatBox("Chart URL exceeded embed limits. Reduce BOT_DEFAULT_GRAPH_DAYS."),
      });
    }
  } else {
    embed.addFields({
      name: "No Data",
      value: formatBox("No confession data available for the selected window."),
    });
  }

  return withBranding(embed, config);
}
