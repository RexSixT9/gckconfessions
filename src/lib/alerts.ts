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

type AuditEventDeliveryPayload = {
  auditId: string;
  action: string;
  requestId: string;
  route: string;
  method: string;
  ip: string;
  userAgent: string;
  adminEmail: string;
  createdAt: string;
  meta: Record<string, unknown>;
};

type DeliveryChannel =
  | "security_alert_webhook"
  | "security_alert_email"
  | "audit_event_discord_webhook";

export type DeliveryOutcome = {
  channel: DeliveryChannel;
  delivered: boolean;
  error?: string;
};

const ALERT_TIMEOUT_MS = Number(process.env.SECURITY_ALERT_TIMEOUT_MS ?? 5000);
const ALERT_MAX_RETRIES = Number(process.env.SECURITY_ALERT_MAX_RETRIES ?? 2);
const REDACTED = "[REDACTED]";
const DISCORD_COLORS = {
  critical: 0xff3b30,
  danger: 0xe03131,
  warning: 0xf08c00,
  info: 0x1c7ed6,
  success: 0x2f9e44,
  neutral: 0x495057,
} as const;
const REDACT_KEYS = [
  "password",
  "pass",
  "token",
  "jwt",
  "setupkey",
  "secret",
  "authorization",
  "cookie",
  "csrf",
  "apikey",
  "webhook",
];

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shouldRedactKey(key: string) {
  const normalized = key.toLowerCase();
  return REDACT_KEYS.some((entry) => normalized.includes(entry));
}

function redactMetaValue(value: unknown, depth = 0): unknown {
  if (depth > 4) return "[TRUNCATED]";

  if (Array.isArray(value)) {
    return value.slice(0, 25).map((item) => redactMetaValue(item, depth + 1));
  }

  if (value && typeof value === "object") {
    const source = value as Record<string, unknown>;
    const output: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(source)) {
      output[key] = shouldRedactKey(key) ? REDACTED : redactMetaValue(nested, depth + 1);
    }
    return output;
  }

  if (typeof value === "string") {
    return value.length > 240 ? `${value.slice(0, 240)}...[TRUNCATED]` : value;
  }

  return value;
}

function redactMeta(meta: Record<string, unknown>) {
  return redactMetaValue(meta, 0) as Record<string, unknown>;
}

function resolveAuditActionColor(action: string) {
  switch (action) {
    case "security_alert":
      return DISCORD_COLORS.critical;

    case "admin_login_failed":
    case "admin_setup_failed":
    case "audit_webhook_failed":
    case "security_alert_webhook_failed":
    case "security_alert_email_failed":
      return DISCORD_COLORS.danger;

    case "status_changed":
    case "confession_updated":
    case "unpublished":
      return DISCORD_COLORS.warning;

    case "admin_session_checked":
      return DISCORD_COLORS.info;

    case "admin_login":
    case "admin_logout":
    case "admin_setup_completed":
    case "admin_created":
    case "confession_created":
    case "published":
    case "audit_webhook_delivered":
    case "security_alert_webhook_delivered":
    case "security_alert_email_delivered":
      return DISCORD_COLORS.success;

    case "admin_deleted":
    case "confession_deleted":
      return DISCORD_COLORS.warning;

    default:
      if (action.endsWith("_failed")) {
        return DISCORD_COLORS.danger;
      }
      if (action.endsWith("_delivered") || action.endsWith("_completed") || action.endsWith("_created")) {
        return DISCORD_COLORS.success;
      }
      if (action.endsWith("_updated") || action.endsWith("_deleted")) {
        return DISCORD_COLORS.warning;
      }
      return DISCORD_COLORS.neutral;
  }
}

function reasonToMessage(reason: unknown) {
  if (reason instanceof Error) {
    return reason.message;
  }
  return String(reason);
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

function createDiscordEmbed(payload: AuditEventDeliveryPayload) {
  const sanitizedMeta = redactMeta(payload.meta);
  const summary = [
    `Action: ${payload.action}`,
    `Request ID: ${payload.requestId}`,
    `Route: ${payload.method} ${payload.route}`,
    `Admin: ${payload.adminEmail || "(none)"}`,
    `IP: ${payload.ip}`,
  ].join("\n");

  return {
    title: "Audit Event",
    description: summary,
    color: resolveAuditActionColor(payload.action),
    timestamp: payload.createdAt,
    fields: [
      {
        name: "Meta",
        value: "```json\n" + JSON.stringify(sanitizedMeta, null, 2).slice(0, 1000) + "\n```",
      },
      {
        name: "User Agent",
        value: payload.userAgent ? payload.userAgent.slice(0, 1000) : "(empty)",
      },
      {
        name: "Audit ID",
        value: payload.auditId,
      },
    ],
  };
}

async function sendDiscordAuditWebhook(payload: AuditEventDeliveryPayload) {
  const url = process.env.DISCORD_AUDIT_WEBHOOK_URL;
  if (!url) return;

  const username = process.env.DISCORD_AUDIT_WEBHOOK_USERNAME || "GCK Audit";
  const avatarUrl = process.env.DISCORD_AUDIT_WEBHOOK_AVATAR_URL || undefined;

  await withRetry("Discord audit webhook delivery", async () => {
    const response = await fetchWithTimeout(
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          avatar_url: avatarUrl,
          embeds: [createDiscordEmbed(payload)],
        }),
      },
      ALERT_TIMEOUT_MS
    );

    if (!response.ok) {
      throw new Error(`Discord audit delivery failed with status ${response.status}`);
    }
  });
}

export async function deliverSecurityAlert(payload: SecurityAlertDeliveryPayload): Promise<DeliveryOutcome[]> {
  const results = await Promise.allSettled([
    sendWebhookAlert(payload),
    sendEmailAlert(payload),
  ]);

  const normalized: DeliveryOutcome[] = [
    {
      channel: "security_alert_webhook",
      delivered: results[0]?.status === "fulfilled",
      ...(results[0]?.status === "rejected" ? { error: reasonToMessage(results[0].reason) } : {}),
    },
    {
      channel: "security_alert_email",
      delivered: results[1]?.status === "fulfilled",
      ...(results[1]?.status === "rejected" ? { error: reasonToMessage(results[1].reason) } : {}),
    },
  ];

  for (const result of results) {
    if (result.status === "rejected") {
      safeLogError("Security alert delivery failed", result.reason);
    }
  }

  return normalized;
}

export async function deliverAuditEvent(payload: AuditEventDeliveryPayload): Promise<DeliveryOutcome[]> {
  const result = await Promise.allSettled([
    sendDiscordAuditWebhook(payload),
  ]);

  const normalized: DeliveryOutcome[] = [
    {
      channel: "audit_event_discord_webhook",
      delivered: result[0]?.status === "fulfilled",
      ...(result[0]?.status === "rejected" ? { error: reasonToMessage(result[0].reason) } : {}),
    },
  ];

  for (const item of result) {
    if (item.status === "rejected") {
      safeLogError("Audit event delivery failed", item.reason);
    }
  }

  return normalized;
}
