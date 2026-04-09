import type { MessageCreateOptions } from "discord.js";

export interface CommandInteraction {
  commandName: string;
  deferReply: (...args: any[]) => Promise<any>;
  editReply: (...args: any[]) => Promise<any>;
  reply: (...args: any[]) => Promise<any>;
}

export interface CommandDeps {
  config: any;
  state: any;
  fetchMetrics: (config: any, state: any, days: number) => Promise<any>;
  buildBotHealthEmbed: (state: any, config: any) => any;
  buildStatusEmbed: (metrics: any, config: any, variant?: string) => any;
  buildQueueEmbed: (metrics: any, config: any) => any;
  buildWebhookHealthEmbed: (metrics: any, config: any) => any;
  buildNavigationComponents: (config: any) => any;
}

export type CommandHandler = (interaction: CommandInteraction, deps: CommandDeps) => Promise<void>;
