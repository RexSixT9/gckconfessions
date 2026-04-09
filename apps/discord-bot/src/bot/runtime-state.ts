import { METRICS_ERROR_LOG_COOLDOWN_MS } from "./constants.ts";
import { toIsoTimestamp } from "./helpers.ts";
import type { BotConfig } from "./config.ts";
import type { MetricsSnapshot, RealtimePoint, RuntimeState } from "./types.ts";

export function createRuntimeState(config: BotConfig): RuntimeState {
  return {
    isShuttingDown: false,
    shutdownStarted: false,
    statusTimer: null,
    nextStatusRunAt: 0,
    statusUpdateInFlight: false,
    runtimeStatusMessageId: config.statusMessageId,
    realtimeHistory: [],
    lastMetricsErrorKey: "",
    lastMetricsErrorAt: 0,
    runtimeStats: {
      startedAt: Date.now(),
      fetch: {
        total: 0,
        retries: 0,
        successes: 0,
        failures: 0,
        consecutiveFailures: 0,
        lastAttemptAt: 0,
        lastSuccessAt: 0,
        lastFailureAt: 0,
        lastDurationMs: 0,
        lastError: "",
      },
      statusLoop: {
        runs: 0,
        skipped: 0,
        successes: 0,
        failures: 0,
        consecutiveFailures: 0,
        lastRunAt: 0,
        lastSuccessAt: 0,
        lastFailureAt: 0,
        lastDurationMs: 0,
        lastError: "",
      },
      commands: {
        total: 0,
        lastAt: 0,
        byName: {},
      },
    },
  };
}

export function logMetricsError(state: RuntimeState, scope: string, error: unknown): void {
  const now = Date.now();
  const key = error instanceof Error ? error.message.slice(0, 180) : String(error).slice(0, 180);
  if (key === state.lastMetricsErrorKey && now - state.lastMetricsErrorAt < METRICS_ERROR_LOG_COOLDOWN_MS) {
    return;
  }

  state.lastMetricsErrorKey = key;
  state.lastMetricsErrorAt = now;
  console.error(scope, error);
}

export function trackCommandUsage(state: RuntimeState, commandName: string): void {
  state.runtimeStats.commands.total += 1;
  state.runtimeStats.commands.lastAt = Date.now();
  state.runtimeStats.commands.byName[commandName] =
    (state.runtimeStats.commands.byName[commandName] || 0) + 1;
}

export function recordRealtimePoint(state: RuntimeState, config: BotConfig, metrics: MetricsSnapshot): void {
  const queue = metrics?.queue || {};
  const point: RealtimePoint = {
    at: toIsoTimestamp(metrics?.generatedAt),
    pending: Number(queue.pending || 0),
    approved: Number(queue.approved || 0),
    published: Number(queue.published || 0),
    total: Number(queue.total || 0),
  };

  const last = state.realtimeHistory.at(-1);
  if (last && last.at === point.at) {
    state.realtimeHistory[state.realtimeHistory.length - 1] = point;
  } else {
    state.realtimeHistory.push(point);
  }

  while (state.realtimeHistory.length > config.realtimeHistoryPoints) {
    state.realtimeHistory.shift();
  }
}

export function historyForChart(
  state: RuntimeState,
  config: BotConfig,
  currentMetrics: MetricsSnapshot
): RealtimePoint[] {
  const withCurrent = [...state.realtimeHistory];
  const currentAt = toIsoTimestamp(currentMetrics?.generatedAt);

  if (!withCurrent.some((point) => point.at === currentAt)) {
    const queue = currentMetrics?.queue || {};
    withCurrent.push({
      at: currentAt,
      pending: Number(queue.pending || 0),
      approved: Number(queue.approved || 0),
      published: Number(queue.published || 0),
      total: Number(queue.total || 0),
    });
  }

  if (withCurrent.length <= config.realtimeHistoryPoints) {
    return withCurrent;
  }

  return withCurrent.slice(withCurrent.length - config.realtimeHistoryPoints);
}
