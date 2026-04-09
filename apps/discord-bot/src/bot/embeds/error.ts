import { EmbedBuilder } from "discord.js";
import { footerFor, formatBox, withBranding } from "./common.ts";

export function buildErrorEmbed(message: string, config: any): any {
  const embed = new EmbedBuilder()
    .setTitle("⛔ Command Failed")
    .setColor(0xe03131)
    .setDescription(formatBox(message))
    .setFooter({ text: footerFor("command", "Error") })
    .setTimestamp(new Date());

  return withBranding(embed, config);
}

export function metricsErrorHint(error: unknown): string {
  const text = String(error instanceof Error ? error.message : error || "");
  if (text.includes("401") || text.toLowerCase().includes("unauthorized")) {
    return "Metrics authentication failed. Verify DISCORD_METRICS_SECRET matches Vercel.";
  }
  if (text.includes("ECONNREFUSED") || text.toLowerCase().includes("refused connection")) {
    return "Metrics endpoint connection was refused. Ensure your app is running on DISCORD_METRICS_URL or point the bot to a live deployment.";
  }
  if (text.includes("ENOTFOUND") || text.includes("EAI_AGAIN") || text.toLowerCase().includes("host lookup failed")) {
    return "Metrics endpoint DNS lookup failed. Verify DISCORD_METRICS_URL host and network DNS resolution.";
  }
  if (text.includes("429")) {
    return "Metrics API is rate limiting requests. Increase poll interval or wait briefly.";
  }
  if (text.includes("Vercel Security Checkpoint")) {
    return "Vercel security checkpoint blocked bot access. Configure VERCEL_PROTECTION_BYPASS (use your VERCEL_AUTOMATION_BYPASS_SECRET value).";
  }
  if (text.toLowerCase().includes("timed out")) {
    return "Metrics request timed out. Check Vercel response time and network egress from Railway.";
  }
  return "Check bot logs and internal metrics endpoint configuration.";
}
