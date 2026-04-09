import assert from "node:assert/strict";
import test from "node:test";
import { MessageFlags } from "discord.js";
import { routeCommandInteraction } from "../../src/features/commands/router.ts";

function createInteraction(commandName: string) {
  return {
    commandName,
    deferReplyCalls: [] as any[],
    editReplyCalls: [] as any[],
    replyCalls: [] as any[],
    async deferReply(payload?: any) {
      this.deferReplyCalls.push(payload);
    },
    async editReply(payload: any) {
      this.editReplyCalls.push(payload);
    },
    async reply(payload: any) {
      this.replyCalls.push(payload);
    },
  };
}

function createDeps() {
  const config = {
    defaultGraphDays: 7,
    ephemeralCommands: ["bot-health"],
    publicCommands: ["status", "queue", "webhook-health"],
  };
  const state = { runtimeStats: {} };

  return {
    config,
    state,
    async fetchMetrics() {
      return { health: {}, queue: {} };
    },
    buildBotHealthEmbed() {
      return { name: "bot-health-embed" };
    },
    buildStatusEmbed() {
      return { name: "status-embed" };
    },
    buildQueueEmbed() {
      return { name: "queue-embed" };
    },
    buildWebhookHealthEmbed() {
      return { name: "webhook-health-embed" };
    },
    buildNavigationComponents() {
      return [{ type: "buttons" }];
    },
  };
}

test("routes /bot-health with ephemeral deferReply and no buttons", async () => {
  const interaction = createInteraction("bot-health");
  const deps = createDeps();

  await routeCommandInteraction(interaction as any, deps as any);

  assert.equal(interaction.deferReplyCalls.length, 1);
  assert.equal(interaction.deferReplyCalls[0]?.flags, MessageFlags.Ephemeral);
  assert.equal(interaction.editReplyCalls.length, 1);
  assert.deepEqual(interaction.editReplyCalls[0].embeds, [{ name: "bot-health-embed" }]);
  assert.deepEqual(interaction.editReplyCalls[0].components, []);
});

test("routes /status and sends status embed", async () => {
  const interaction = createInteraction("status");
  const deps = createDeps();

  await routeCommandInteraction(interaction as any, deps as any);

  assert.equal(interaction.deferReplyCalls.length, 1);
  assert.equal(interaction.editReplyCalls.length, 1);
  assert.deepEqual(interaction.editReplyCalls[0].embeds, [{ name: "status-embed" }]);
  assert.deepEqual(interaction.editReplyCalls[0].components, [{ type: "buttons" }]);
});

test("routes /queue and sends queue embed", async () => {
  const interaction = createInteraction("queue");
  const deps = createDeps();

  await routeCommandInteraction(interaction as any, deps as any);

  assert.equal(interaction.deferReplyCalls.length, 1);
  assert.equal(interaction.editReplyCalls.length, 1);
  assert.deepEqual(interaction.editReplyCalls[0].embeds, [{ name: "queue-embed" }]);
});

test("routes /webhook-health and sends delivery embed", async () => {
  const interaction = createInteraction("webhook-health");
  const deps = createDeps();

  await routeCommandInteraction(interaction as any, deps as any);

  assert.equal(interaction.deferReplyCalls.length, 1);
  assert.equal(interaction.editReplyCalls.length, 1);
  assert.deepEqual(interaction.editReplyCalls[0].embeds, [{ name: "webhook-health-embed" }]);
});

test("unknown command receives ephemeral not-implemented response", async () => {
  const interaction = createInteraction("unknown-command");
  const deps = createDeps();

  await routeCommandInteraction(interaction as any, deps as any);

  assert.equal(interaction.replyCalls.length, 1);
  assert.equal(interaction.replyCalls[0].flags, MessageFlags.Ephemeral);
  assert.equal(interaction.replyCalls[0].content, "Command not implemented.");
});
