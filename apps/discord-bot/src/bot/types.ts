import type {
  ActionRowBuilder,
  ButtonBuilder,
  EmbedBuilder,
  InteractionDeferReplyOptions,
  InteractionEditReplyOptions,
  InteractionReplyOptions,
} from "discord.js";
import type { BotConfig } from "./config.ts";

export type EmbedVariant = "board" | "command";

export interface QueueMetrics {
  pending: number;
  approved: number;
  rejected: number;
  published: number;
  total: number;
}

export interface DailyMetricsPoint {
  day: string;
  submissions: number;
}

export interface ServiceHealth {
  status: string;
}

export interface HealthMetrics {
  overallStatus: string;
  api: ServiceHealth;
  database: ServiceHealth;
}

export interface WebhookChannelMetrics {
  status: string;
  attempts: number;
  successes: number;
  failures: number;
  successRate: number | null;
}

export interface WebhookHealthMetrics {
  overallStatus: string;
  windowHours: number;
  channels: Record<string, WebhookChannelMetrics>;
}

export interface MetricsSnapshot {
  generatedAt: string;
  health: HealthMetrics;
  queue: QueueMetrics;
  daily: DailyMetricsPoint[];
  webhookHealth: WebhookHealthMetrics;
}

export interface RealtimePoint {
  at: string;
  pending: number;
  approved: number;
  published: number;
  total: number;
}

export interface RuntimeFetchStats {
  total: number;
  retries: number;
  successes: number;
  failures: number;
  consecutiveFailures: number;
  lastAttemptAt: number;
  lastSuccessAt: number;
  lastFailureAt: number;
  lastDurationMs: number;
  lastError: string;
}

export interface RuntimeLoopStats {
  runs: number;
  skipped: number;
  successes: number;
  failures: number;
  consecutiveFailures: number;
  lastRunAt: number;
  lastSuccessAt: number;
  lastFailureAt: number;
  lastDurationMs: number;
  lastError: string;
}

export interface RuntimeCommandStats {
  total: number;
  lastAt: number;
  byName: Record<string, number>;
}

export interface RuntimeStats {
  startedAt: number;
  fetch: RuntimeFetchStats;
  statusLoop: RuntimeLoopStats;
  commands: RuntimeCommandStats;
}

export interface RuntimeState {
  isShuttingDown: boolean;
  shutdownStarted: boolean;
  statusTimer: ReturnType<typeof setTimeout> | null;
  nextStatusRunAt: number;
  statusUpdateInFlight: boolean;
  runtimeStatusMessageId: string;
  realtimeHistory: RealtimePoint[];
  lastMetricsErrorKey: string;
  lastMetricsErrorAt: number;
  runtimeStats: RuntimeStats;
}

export interface CommandInteraction {
  commandName: string;
  deferReply: (options?: InteractionDeferReplyOptions) => Promise<unknown>;
  editReply: (options: InteractionEditReplyOptions) => Promise<unknown>;
  reply: (options: InteractionReplyOptions) => Promise<unknown>;
}

export interface CommandDeps {
  config: BotConfig;
  state: RuntimeState;
  fetchMetrics: (config: BotConfig, state: RuntimeState, days: number) => Promise<MetricsSnapshot>;
  buildBotHealthEmbed: (state: RuntimeState, config: BotConfig) => EmbedBuilder;
  buildStatusEmbed: (metrics: MetricsSnapshot, config: BotConfig, variant?: EmbedVariant) => EmbedBuilder;
  buildQueueEmbed: (metrics: MetricsSnapshot, config: BotConfig, variant?: EmbedVariant) => EmbedBuilder;
  buildWebhookHealthEmbed: (
    metrics: MetricsSnapshot,
    config: BotConfig,
    variant?: EmbedVariant
  ) => EmbedBuilder;
  buildNavigationComponents: (config: BotConfig) => ActionRowBuilder<ButtonBuilder>[];
}
