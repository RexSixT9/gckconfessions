import { sinceLabel, untilLabel } from "../helpers.ts";
import type { BotConfig } from "../config.ts";
import type { RuntimeState } from "../types.ts";

const EMBED_MAX_FIELD_NAME = 256;
const EMBED_MAX_FIELD_VALUE = 1_024;
const EMBED_MAX_DESCRIPTION = 4_096;

function clampText(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  if (maxLength <= 3) return value.slice(0, maxLength);
  return `${value.slice(0, maxLength - 3)}...`;
}

export function channelDisplayName(name: string): string {
  if (name === "audit_discord") return "Audit Discord";
  if (name === "security_webhook") return "Security Webhook";
  if (name === "security_email") return "Security Email";
  return String(name || "unknown").replace(/_/g, " ");
}

export function formatBox(lines: string[] | string): string {
  const content = Array.isArray(lines) ? lines.join("\n") : String(lines || "");
  return `\`\`\`txt\n${content}\n\`\`\``;
}

export function safeField(name: string, value: string, inline = false): {
  name: string;
  value: string;
  inline: boolean;
} {
  return {
    name: clampText(name, EMBED_MAX_FIELD_NAME),
    value: clampText(value, EMBED_MAX_FIELD_VALUE),
    inline,
  };
}

export function safeDescription(value: string): string {
  return clampText(value, EMBED_MAX_DESCRIPTION);
}

export function withBranding<T extends { setThumbnail: (url: string) => unknown }>(
  embed: T,
  config: BotConfig
): T {
  if (config?.headerThumbnailUrl) {
    embed.setThumbnail(config.headerThumbnailUrl);
  }
  return embed;
}

export function footerFor(variant: string, section: string): string {
  if (variant === "board") {
    return "GCK Confessions • Live Status";
  }
  return `GCK Confessions • ${section}`;
}

export function nextRunLabel(state: RuntimeState): string {
  return untilLabel(state.nextStatusRunAt);
}

export function dataFreshnessLabel(generatedAt: unknown): string {
  const ms = Date.parse(String(generatedAt || ""));
  if (!Number.isFinite(ms)) return "unknown";
  return sinceLabel(ms);
}

export function isDataStale(generatedAt: unknown, pollIntervalMs: number): boolean {
  const ms = Date.parse(String(generatedAt || ""));
  if (!Number.isFinite(ms)) return true;
  const staleThresholdMs = Math.max(60_000, pollIntervalMs * 3);
  return Date.now() - ms > staleThresholdMs;
}
