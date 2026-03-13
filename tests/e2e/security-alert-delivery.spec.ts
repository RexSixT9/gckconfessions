import { expect, test } from "@playwright/test";
import { deliverSecurityAlert } from "../../src/lib/alerts";

type FetchCall = {
  input: RequestInfo | URL;
  init?: RequestInit;
};

function buildPayload() {
  return {
    auditId: "audit_test_1",
    action: "security_alert" as const,
    requestId: "req_1",
    route: "/api/security/csp-report",
    method: "POST",
    ip: "127.0.0.1",
    userAgent: "Playwright",
    adminEmail: "admin@example.com",
    createdAt: new Date().toISOString(),
    meta: { type: "csp_report" },
  };
}

test.describe("security alert delivery", () => {
  test("sends webhook and email when configured", async () => {
    const priorEnv = {
      SECURITY_ALERT_WEBHOOK_URL: process.env.SECURITY_ALERT_WEBHOOK_URL,
      SECURITY_ALERT_WEBHOOK_AUTH: process.env.SECURITY_ALERT_WEBHOOK_AUTH,
      RESEND_API_KEY: process.env.RESEND_API_KEY,
      SECURITY_ALERT_EMAIL_FROM: process.env.SECURITY_ALERT_EMAIL_FROM,
      SECURITY_ALERT_EMAIL_TO: process.env.SECURITY_ALERT_EMAIL_TO,
    };

    process.env.SECURITY_ALERT_WEBHOOK_URL = "https://example.invalid/webhook";
    process.env.SECURITY_ALERT_WEBHOOK_AUTH = "Bearer test-token";
    process.env.RESEND_API_KEY = "resend-test";
    process.env.SECURITY_ALERT_EMAIL_FROM = "alerts@example.com";
    process.env.SECURITY_ALERT_EMAIL_TO = "owner@example.com,sec@example.com";

    const fetchCalls: FetchCall[] = [];
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      fetchCalls.push({ input, init });
      return new Response("ok", { status: 200 });
    }) as typeof fetch;

    try {
      await deliverSecurityAlert(buildPayload());
    } finally {
      globalThis.fetch = originalFetch;
      process.env.SECURITY_ALERT_WEBHOOK_URL = priorEnv.SECURITY_ALERT_WEBHOOK_URL;
      process.env.SECURITY_ALERT_WEBHOOK_AUTH = priorEnv.SECURITY_ALERT_WEBHOOK_AUTH;
      process.env.RESEND_API_KEY = priorEnv.RESEND_API_KEY;
      process.env.SECURITY_ALERT_EMAIL_FROM = priorEnv.SECURITY_ALERT_EMAIL_FROM;
      process.env.SECURITY_ALERT_EMAIL_TO = priorEnv.SECURITY_ALERT_EMAIL_TO;
    }

    expect(fetchCalls).toHaveLength(2);
    expect(String(fetchCalls[0].input)).toBe("https://example.invalid/webhook");
    expect(String(fetchCalls[1].input)).toBe("https://api.resend.com/emails");
  });

  test("does not throw when one channel fails", async () => {
    const priorEnv = {
      SECURITY_ALERT_WEBHOOK_URL: process.env.SECURITY_ALERT_WEBHOOK_URL,
      RESEND_API_KEY: process.env.RESEND_API_KEY,
      SECURITY_ALERT_EMAIL_FROM: process.env.SECURITY_ALERT_EMAIL_FROM,
      SECURITY_ALERT_EMAIL_TO: process.env.SECURITY_ALERT_EMAIL_TO,
    };

    process.env.SECURITY_ALERT_WEBHOOK_URL = "https://example.invalid/webhook";
    process.env.RESEND_API_KEY = "resend-test";
    process.env.SECURITY_ALERT_EMAIL_FROM = "alerts@example.com";
    process.env.SECURITY_ALERT_EMAIL_TO = "owner@example.com";

    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      if (String(input).includes("example.invalid")) {
        return new Response("fail", { status: 500 });
      }
      return new Response("ok", { status: 200 });
    }) as typeof fetch;

    try {
      await expect(deliverSecurityAlert(buildPayload())).resolves.toBeUndefined();
    } finally {
      globalThis.fetch = originalFetch;
      process.env.SECURITY_ALERT_WEBHOOK_URL = priorEnv.SECURITY_ALERT_WEBHOOK_URL;
      process.env.RESEND_API_KEY = priorEnv.RESEND_API_KEY;
      process.env.SECURITY_ALERT_EMAIL_FROM = priorEnv.SECURITY_ALERT_EMAIL_FROM;
      process.env.SECURITY_ALERT_EMAIL_TO = priorEnv.SECURITY_ALERT_EMAIL_TO;
    }
  });
});
