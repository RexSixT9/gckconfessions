import { EmbedBuilder } from "discord.js";
import { compactNumber, durationLabel, sinceLabel } from "../helpers.ts";
import type { BotConfig } from "../config.ts";
import type { RuntimeState } from "../types.ts";
import {
  footerFor,
  formatBox,
  nextRunLabel,
  safeDescription,
  safeField,
  withBranding,
} from "./common.ts";

export function buildBotHealthEmbed(state: RuntimeState, config: BotConfig): EmbedBuilder {
  const fetch = state.runtimeStats.fetch;
  const loop = state.runtimeStats.statusLoop;
  const commands = state.runtimeStats.commands;

  const sortedCommands = Object.entries(commands.byName)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([name, count]) => `${name}: ${compactNumber(count)}`)
    .join("\n");

  const degraded = fetch.consecutiveFailures > 0 || loop.consecutiveFailures > 0;
  const staleThresholdMs = Math.max(60_000, config.pollIntervalMs * 3);
  const staleData = !fetch.lastSuccessAt || Date.now() - fetch.lastSuccessAt > staleThresholdMs;

  const embed = new EmbedBuilder()
    .setTitle("🩺 Bot Runtime Health")
    .setColor(degraded ? 0xf08c00 : 0x2f9e44)
    .setDescription(
      safeDescription(
        `Runtime is ${degraded ? "DEGRADED" : "HEALTHY"}. Metrics data is ${staleData ? "STALE" : "FRESH"}.`
      )
    )
    .addFields(
      safeField(
        "⏱️ Runtime",
        formatBox([
          `Uptime: ${durationLabel(Date.now() - state.runtimeStats.startedAt)}`,
          `Shutting down: ${state.isShuttingDown ? "yes" : "no"}`,
          `Status in-flight: ${state.statusUpdateInFlight ? "yes" : "no"}`,
          `Next status run: ${nextRunLabel(state)}`,
        ]),
      ),
      safeField(
        "🌐 Metrics",
        formatBox([
          `Total: ${compactNumber(fetch.total)} (ok ${compactNumber(fetch.successes)}, fail ${compactNumber(fetch.failures)})`,
          `Retries: ${compactNumber(fetch.retries)} | Consecutive fail: ${compactNumber(fetch.consecutiveFailures)}`,
          `Last latency: ${durationLabel(fetch.lastDurationMs)}`,
          `Last success: ${sinceLabel(fetch.lastSuccessAt)} | Last fail: ${sinceLabel(fetch.lastFailureAt)}`,
          `Freshness: ${sinceLabel(fetch.lastSuccessAt)}${staleData ? " ⚠️" : ""}`,
        ]),
      ),
      safeField(
        "🔁 Status Loop",
        formatBox([
          `Runs: ${compactNumber(loop.runs)} (ok ${compactNumber(loop.successes)}, fail ${compactNumber(loop.failures)})`,
          `Skipped: ${compactNumber(loop.skipped)} | Consecutive fail: ${compactNumber(loop.consecutiveFailures)}`,
          `Last run: ${sinceLabel(loop.lastRunAt)} | Last duration: ${durationLabel(loop.lastDurationMs)}`,
          `Board message id: ${state.runtimeStatusMessageId || "not set"}`,
        ]),
      ),
      safeField(
        "⌨️ Commands",
        formatBox([
          `Total: ${compactNumber(commands.total)} | Last used: ${sinceLabel(commands.lastAt)}`,
          `Top commands:\n${sortedCommands || "none"}`,
        ]),
      ),
      safeField(
        "⚙️ Config",
        formatBox([
          `Poll: ${durationLabel(config.pollIntervalMs)} | Timeout: ${durationLabel(config.metricsTimeoutMs)}`,
          `Retry: ${compactNumber(config.metricsRetryAttempts)} attempts @ base ${durationLabel(config.metricsRetryBaseMs)}`,
          `Realtime points: ${compactNumber(config.realtimeHistoryPoints)}`,
        ]),
      )
    )
    .setFooter({ text: footerFor("command", "Bot Health") })
    .setTimestamp(new Date());

  if (fetch.lastError) {
    embed.addFields(safeField("Last Fetch Error", formatBox(fetch.lastError)));
  }

  if (loop.lastError) {
    embed.addFields(safeField("Last Loop Error", formatBox(loop.lastError)));
  }

  if (staleData) {
    embed.addFields(
      safeField(
        "Data Freshness Warning",
        formatBox(
          `Latest successful metrics fetch is older than ${durationLabel(staleThresholdMs)}. Check metrics endpoint health.`
        )
      )
    );
  }

  return withBranding(embed, config);
}
