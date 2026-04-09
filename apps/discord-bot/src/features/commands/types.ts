import type { CommandDeps, CommandInteraction } from "../../bot/types.ts";

export type { CommandDeps, CommandInteraction };

export type CommandHandler = (interaction: CommandInteraction, deps: CommandDeps) => Promise<void>;
