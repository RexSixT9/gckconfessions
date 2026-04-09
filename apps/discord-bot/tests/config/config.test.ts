import assert from "node:assert/strict";
import test from "node:test";
import { buildConfig } from "../../src/bot/config.ts";

const BASE_ENV = {
  DISCORD_BOT_TOKEN: "token-example",
  DISCORD_CLIENT_ID: "1491363367015682118",
  DISCORD_GUILD_ID: "1079823763123748884",
  DISCORD_OWNER_ROLE_ID: "1208420742828531752",
  DISCORD_STATUS_CHANNEL_ID: "1491363943468498975",
  DISCORD_METRICS_URL: "https://gckconfessions.vercel.app/api/internal/discord-metrics",
  DISCORD_METRICS_SECRET: "metrics-secret-example",
};

function withEnv(overrides: Record<string, string>, fn: () => void) {
  const previousEnv = process.env;
  process.env = { ...previousEnv, ...BASE_ENV, ...overrides };
  try {
    return fn();
  } finally {
    process.env = previousEnv;
  }
}

test("uses VERCEL_AUTOMATION_BYPASS_SECRET fallback when VERCEL_PROTECTION_BYPASS is empty", () => {
  withEnv(
    {
      VERCEL_PROTECTION_BYPASS: "",
      VERCEL_AUTOMATION_BYPASS_SECRET: "automation-secret",
    },
    () => {
      const config = buildConfig();
      assert.equal(config.vercelProtectionBypass, "automation-secret");
    }
  );
});

test("clamps BOT_POLL_INTERVAL_MS to configured minimum and maximum", () => {
  withEnv({ BOT_POLL_INTERVAL_MS: "1000" }, () => {
    const config = buildConfig();
    assert.equal(config.pollIntervalMs, 30_000);
  });

  withEnv({ BOT_POLL_INTERVAL_MS: "900000" }, () => {
    const config = buildConfig();
    assert.equal(config.pollIntervalMs, 600_000);
  });
});

test("throws when required environment variable is missing", () => {
  assert.throws(
    () =>
      withEnv(
        {
          DISCORD_BOT_TOKEN: "",
        },
        () => buildConfig()
      ),
    /Missing required env var: DISCORD_BOT_TOKEN/
  );
});

test("rejects invalid DISCORD_METRICS_URL protocol", () => {
  assert.throws(
    () =>
      withEnv(
        {
          DISCORD_METRICS_URL: "ftp://example.com/metrics",
        },
        () => buildConfig()
      ),
    /DISCORD_METRICS_URL must use http:\/\/ or https:\/\//
  );
});

test("parses command visibility lists from environment", () => {
  withEnv(
    {
      BOT_EPHEMERAL_COMMANDS: "bot-health, queue",
      BOT_PUBLIC_COMMANDS: "status,webhook-health",
      BOT_BUTTON_COMMANDS: "status",
    },
    () => {
      const config = buildConfig();
      assert.deepEqual(config.ephemeralCommands, ["bot-health", "queue"]);
      assert.deepEqual(config.publicCommands, ["status", "webhook-health"]);
      assert.deepEqual(config.buttonCommands, ["status"]);
    }
  );
});
