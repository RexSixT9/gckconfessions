import { untilLabel } from "../helpers.ts";

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

export function withBranding(embed: any, config: any): any {
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

export function nextRunLabel(state: any): string {
  return untilLabel(state.nextStatusRunAt);
}
