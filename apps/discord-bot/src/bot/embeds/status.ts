import { EmbedBuilder } from "discord.js";
import { compactNumber, statusColor, statusIcon, statusLabel } from "../helpers.ts";
import { buildQuickChartUrl } from "../charts.ts";
import type { BotConfig } from "../config.ts";
import type { EmbedVariant, MetricsSnapshot } from "../types.ts";
import {
  dataFreshnessLabel,
  footerFor,
  formatBox,
  isDataStale,
  safeDescription,
  safeField,
  withBranding,
} from "./common.ts";

export function buildStatusEmbed(
  metrics: MetricsSnapshot,
  config: BotConfig,
  variant: EmbedVariant = "command"
): EmbedBuilder {
  const health = metrics?.health || {};
  const queue = metrics?.queue || {};
  const daily = Array.isArray(metrics?.daily) ? metrics.daily : [];
  const latestDaily = daily.at(-1);
  const dailySubmissions = Number(latestDaily?.submissions || 0);
  const totalSubmissions = daily.reduce((sum: number, point) => sum + Number(point.submissions || 0), 0);
  const averageSubmissions = daily.length > 0 ? Math.round(totalSubmissions / daily.length) : 0;
  const chartUrl = daily.length > 0 ? buildQuickChartUrl(daily) : "";
  const apiStatus = health?.api?.status || "unknown";
  const databaseStatus = health?.database?.status || "unknown";
  const deliveryStatus = metrics?.webhookHealth?.overallStatus || "unknown";
  const healthColor = statusColor(health?.overallStatus);
  const boardColor = healthColor === 0x2f9e44 ? 0x221433 : healthColor;
  const freshness = dataFreshnessLabel(metrics?.generatedAt);
  const stale = isDataStale(metrics?.generatedAt, config.pollIntervalMs);

  const embed = new EmbedBuilder()
    .setTitle("GCK CONFESSIONS")
    .setColor(boardColor)
    .setDescription(
      safeDescription(`Live status board • Data: ${freshness}${stale ? " (stale)" : ""}`)
    )
    .addFields(
      safeField(
        "🩺 STATUS",
        formatBox([
          `Overall : ${statusIcon(health?.overallStatus)} ${statusLabel(health?.overallStatus)}`,
          `API     : ${statusIcon(apiStatus)} ${statusLabel(apiStatus)}`,
          `DB      : ${statusIcon(databaseStatus)} ${statusLabel(databaseStatus)}`,
          `Data    : ${freshness}${stale ? " ⚠️" : ""}`,
        ]),
        false
      ),
      safeField(
        "📝 DAILY SUBMISSIONS",
        formatBox([
          `Today   : ${compactNumber(dailySubmissions)}`,
          `Avg/day : ${compactNumber(averageSubmissions)}`,
          `Window  : ${compactNumber(totalSubmissions)} (${compactNumber(daily.length)}d)`,
        ]),
        false
      ),
      safeField(
        "🔔 DELIVERY",
        formatBox([
          `Delivery: ${statusIcon(deliveryStatus)} ${statusLabel(deliveryStatus)}`,
          `Window  : ${compactNumber(metrics?.webhookHealth?.windowHours || 0)}h`,
        ]),
        false
      ),
      safeField(
        "📦 QUEUE",
        formatBox([
          `Pending  : ${compactNumber(queue.pending)}`,
          `Approved : ${compactNumber(queue.approved)}`,
          `Rejected : ${compactNumber(queue.rejected)}`,
          `Published: ${compactNumber(queue.published)}`,
          `Total    : ${compactNumber(queue.total)}`,
        ]),
        false
      )
    )
    .setFooter({ text: footerFor(variant, "Status") })
    .setTimestamp(new Date(metrics?.generatedAt || Date.now()));

  if (chartUrl) {
    embed.setImage(chartUrl);
  } else if (daily.length === 0) {
    embed.addFields(
      safeField("📈 TREND", formatBox("No confession data available for the selected window."), false)
    );
  } else {
    embed.addFields(
      safeField(
        "📈 TREND",
        formatBox("Chart URL exceeded embed limits. Reduce BOT_DEFAULT_GRAPH_DAYS."),
        false
      )
    );
  }

  return withBranding(embed, config);
}
