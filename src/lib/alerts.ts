import { safeLogError } from "@/lib/api";

type SecurityAlertDeliveryPayload = {
  auditId: string;
  action: "security_alert";
  requestId: string;
  route: string;
  method: string;
  ip: string;
  userAgent: string;
  adminEmail: string;
  createdAt: string;
  meta: Record<string, unknown>;
};

const ALERT_TIMEOUT_MS = Number(process.env.SECURITY_ALERT_TIMEOUT_MS ?? 5000);
const ALERT_MAX_RETRIES = Number(process.env.SECURITY_ALERT_MAX_RETRIES ?? 2);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function withRetry(taskName: string, fn: () => Promise<void>) {
  let attempt = 0;
  let lastError: unknown = null;

  while (attempt <= ALERT_MAX_RETRIES) {
    try {
      await fn();
      return;
    } catch (error) {
      lastError = error;
      if (attempt === ALERT_MAX_RETRIES) {
        break;
      }
      // Backoff: 250ms, 500ms, 1000ms...
      await sleep(250 * 2 ** attempt);
    }
    attempt += 1;
  }

  throw new Error(`${taskName} failed after retries: ${String(lastError)}`);
}

function getAlertRecipients() {
  const raw = process.env.SECURITY_ALERT_EMAIL_TO ?? "";
  return raw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function createEmailText(payload: SecurityAlertDeliveryPayload) {
  return [
    "Security alert triggered",
    `Audit ID: ${payload.auditId}`,
    `Action: ${payload.action}`,
    `Route: ${payload.method} ${payload.route}`,
    `Request ID: ${payload.requestId}`,
    `IP: ${payload.ip}`,
    `Admin: ${payload.adminEmail || "(none)"}`,
    `Created At: ${payload.createdAt}`,
    "",
    "Meta:",
    JSON.stringify(payload.meta, null, 2),
  ].join("\n");
}

async function sendWebhookAlert(payload: SecurityAlertDeliveryPayload) {
  const url = process.env.SECURITY_ALERT_WEBHOOK_URL;
  if (!url) return;

  const authHeader = process.env.SECURITY_ALERT_WEBHOOK_AUTH;
  await withRetry("Webhook alert delivery", async () => {
    const response = await fetchWithTimeout(
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
        body: JSON.stringify(payload),
      },
      ALERT_TIMEOUT_MS
    );

    if (!response.ok) {
      throw new Error(`Webhook alert delivery failed with status ${response.status}`);
    }
  });
}

async function sendEmailAlert(payload: SecurityAlertDeliveryPayload) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.SECURITY_ALERT_EMAIL_FROM;
  const to = getAlertRecipients();

  if (!apiKey || !from || to.length === 0) return;

  await withRetry("Email alert delivery", async () => {
    const response = await fetchWithTimeout(
      "https://api.resend.com/emails",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to,
          subject: `[SECURITY ALERT] ${payload.meta.type ?? payload.route}`,
          text: createEmailText(payload),
        }),
      },
      ALERT_TIMEOUT_MS
    );

    if (!response.ok) {
      throw new Error(`Email alert delivery failed with status ${response.status}`);
    }
  });
}

export async function deliverSecurityAlert(payload: SecurityAlertDeliveryPayload) {
  const results = await Promise.allSettled([
    sendWebhookAlert(payload),
    sendEmailAlert(payload),
  ]);

  for (const result of results) {
    if (result.status === "rejected") {
      safeLogError("Security alert delivery failed", result.reason);
    }
  }
}
