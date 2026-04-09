import assert from "node:assert/strict";
import test from "node:test";
import { MessageFlags } from "discord.js";
import { componentsForCommand, deferByCommandPolicy, isEphemeralCommand } from "../../src/features/commands/reply-policy.ts";

function createDeps() {
  return {
    config: {
      ephemeralCommands: ["bot-health"],
      publicCommands: ["status", "queue", "webhook-health"],
    },
    buildNavigationComponents() {
      return [{ type: "buttons" }];
    },
  } as any;
}

test("isEphemeralCommand prefers public command allow-list", () => {
  const deps = createDeps();
  deps.config.ephemeralCommands.push("status");

  assert.equal(isEphemeralCommand("status", deps), false);
  assert.equal(isEphemeralCommand("bot-health", deps), true);
});

test("deferByCommandPolicy uses ephemeral defer for configured commands", async () => {
  const deps = createDeps();
  const calls: any[] = [];
  const interaction = {
    commandName: "bot-health",
    async deferReply(payload?: any) {
      calls.push(payload);
    },
  };

  await deferByCommandPolicy(interaction as any, deps);

  assert.equal(calls.length, 1);
  assert.equal(calls[0]?.flags, MessageFlags.Ephemeral);
});

test("componentsForCommand suppresses buttons for ephemeral commands", () => {
  const deps = createDeps();

  assert.deepEqual(componentsForCommand("bot-health", deps), []);
  assert.deepEqual(componentsForCommand("status", deps), [{ type: "buttons" }]);
});
