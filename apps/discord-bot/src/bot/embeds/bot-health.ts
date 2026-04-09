import { EmbedBuilder } from "discord.js";
import { compactNumber, durationLabel, sinceLabel } from "../helpers.ts";
import { footerFor, formatBox, nextRunLabel, withBranding } from "./common.ts";

export function buildBotHealthEmbed(state: any, config: any): any {
  const fetch = state.runtimeStats.fetch;
  const loop = state.runtimeStats.statusLoop;
  const commands = state.runtimeStats.commands;

  const sortedCommands = Object.entries(commands.byName)
    .sort((a: any, b: any) => b[1] - a[1])
    .slice(0, 4)
    .map(([name, count]) => `${name}: ${compactNumber(count)}`)
    .join("\n");

  const degraded = fetch.consecutiveFailures > 0 || loop.consecutiveFailures > 0;

  const embed = new EmbedBuilder()
    .setTitle("🩺 Bot Runtime Health")
    .setColor(degraded ? 0xf08c00 : 0x2f9e44)
    .setDescription(`Runtime is ${degraded ? "DEGRADED" : "HEALTHY"}.`)
    .addFields(
      {
        name: "⏱️ Runtime",
        value: formatBox([
          `Uptime: ${durationLabel(Date.now() - state.runtimeStats.startedAt)}`,
          `Shutting down: ${state.isShuttingDown ? "yes" : "no"}`,
          `Status in-flight: ${state.statusUpdateInFlight ? "yes" : "no"}`,
          `Next status run: ${nextRunLabel(state)}`,
        ]),
      },
      {
        name: "🌐 Metrics",
        value: formatBox([
          `Total: ${compactNumber(fetch.total)} (ok ${compactNumber(fetch.successes)}, fail ${compactNumber(fetch.failures)})`,
          `Retries: ${compactNumber(fetch.retries)} | Consecutive fail: ${compactNumber(fetch.consecutiveFailures)}`,
          `Last latency: ${durationLabel(fetch.lastDurationMs)}`,
          `Last success: ${sinceLabel(fetch.lastSuccessAt)} | Last fail: ${sinceLabel(fetch.lastFailureAt)}`,
        ]),
      },
      {
        name: "🔁 Status Loop",
        value: formatBox([
          `Runs: ${compactNumber(loop.runs)} (ok ${compactNumber(loop.successes)}, fail ${compactNumber(loop.failures)})`,
          `Skipped: ${compactNumber(loop.skipped)} | Consecutive fail: ${compactNumber(loop.consecutiveFailures)}`,
          `Last run: ${sinceLabel(loop.lastRunAt)} | Last duration: ${durationLabel(loop.lastDurationMs)}`,
          `Board message id: ${state.runtimeStatusMessageId || "not set"}`,
        ]),
      },
      {
        name: "⌨️ Commands",
        value: formatBox([
          `Total: ${compactNumber(commands.total)} | Last used: ${sinceLabel(commands.lastAt)}`,
          `Top commands:\n${sortedCommands || "none"}`,
        ]),
      },
      {
        name: "⚙️ Config",
        value: formatBox([
          `Poll: ${durationLabel(config.pollIntervalMs)} | Timeout: ${durationLabel(config.metricsTimeoutMs)}`,
          `Retry: ${compactNumber(config.metricsRetryAttempts)} attempts @ base ${durationLabel(config.metricsRetryBaseMs)}`,
          `Realtime points: ${compactNumber(config.realtimeHistoryPoints)}`,
        ]),
      }
    )
    .setFooter({ text: footerFor("command", "Bot Health") })
    .setTimestamp(new Date());

  if (fetch.lastError) {
    embed.addFields({
      name: "Last Fetch Error",
      value: formatBox(fetch.lastError),
    });
  }

  if (loop.lastError) {
    embed.addFields({
      name: "Last Loop Error",
      value: formatBox(loop.lastError),
    });
  }

  return withBranding(embed, config);
}
