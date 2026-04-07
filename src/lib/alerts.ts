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
const AUDIT_WEBHOOK_TIMEOUT_MS = Number(process.env.AUDIT_WEBHOOK_TIMEOUT_MS ?? 1800);
const AUDIT_WEBHOOK_MAX_RETRIES = Number(process.env.AUDIT_WEBHOOK_MAX_RETRIES ?? 1);
const AUDIT_WEBHOOK_BACKOFF_MS = Number(process.env.AUDIT_WEBHOOK_BACKOFF_MS ?? 120);
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

type VisualTone = keyof typeof DISCORD_COLORS;

type WebhookVisual = {
  tone: VisualTone;
  severity: "critical" | "high" | "medium" | "info" | "low";
  badge: string;
  colorInt: number;
  colorHex: string;
};

type RetryOptions = {
  maxRetries: number;
  baseBackoffMs?: number;
};

class RetryableDeliveryError extends Error {
  retryAfterMs?: number;

  constructor(message: string, retryAfterMs?: number) {
    super(message);
    this.name = "RetryableDeliveryError";
    this.retryAfterMs = retryAfterMs;
  }
}

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

function toOneLine(value: unknown, maxLen = 140) {
  if (value === null || value === undefined) return "(null)";
  if (typeof value === "string") return value.length > maxLen ? `${value.slice(0, maxLen)}...` : value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    const preview = value
      .slice(0, 3)
      .map((entry) => (typeof entry === "string" || typeof entry === "number" || typeof entry === "boolean" ? String(entry) : "[obj]"))
      .join(", ");
    return value.length > 3 ? `[${preview}, ...] (${value.length})` : `[${preview}] (${value.length})`;
  }
  if (typeof value === "object") return "[object]";
  return String(value);
}

const META_HIGHLIGHT_PRIORITY: Array<{ path: string; label: string }> = [
  { path: "type", label: "type" },
  { path: "sourceAction", label: "sourceAction" },
  { path: "deliveryChannel", label: "deliveryChannel" },
  { path: "delivered", label: "delivered" },
  { path: "anomalyScore", label: "anomalyScore" },
  { path: "deviceType", label: "deviceType" },
  { path: "browser", label: "browser" },
  { path: "os", label: "os" },
  { path: "model", label: "model" },
  { path: "manufacturer", label: "manufacturer" },
  { path: "manufacturerConfidence", label: "manufacturerConfidence" },
  { path: "requestContext.anomalyScore", label: "request.anomalyScore" },
  { path: "requestContext.deviceType", label: "request.deviceType" },
  { path: "requestContext.browser", label: "request.browser" },
  { path: "requestContext.os", label: "request.os" },
  { path: "requestContext.model", label: "request.model" },
  { path: "requestContext.manufacturer", label: "request.manufacturer" },
  { path: "requestContext.manufacturerConfidence", label: "request.manufacturerConfidence" },
  { path: "requestContext.origin", label: "request.origin" },
  { path: "requestContext.referrerOrigin", label: "request.referrerOrigin" },
  { path: "requestContext.secFetchSite", label: "request.secFetchSite" },
  { path: "requestContext.secFetchMode", label: "request.secFetchMode" },
];

function getPathValue(source: Record<string, unknown>, path: string): unknown {
  const parts = path.split(".");
  let current: unknown = source;

  for (const part of parts) {
    if (!current || typeof current !== "object") {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

function isEmptyHighlightValue(value: unknown) {
  return value === undefined || value === "";
}

function createMetaHighlights(meta: Record<string, unknown>, maxEntries = 10) {
  const lines: string[] = [];
  const usedTopLevelKeys = new Set<string>();

  for (const entry of META_HIGHLIGHT_PRIORITY) {
    const value = getPathValue(meta, entry.path);
    if (isEmptyHighlightValue(value)) continue;
    lines.push(`- ${entry.label}: ${toOneLine(value)}`);

    if (!entry.path.includes(".")) {
      usedTopLevelKeys.add(entry.path);
    }

    if (lines.length >= maxEntries) {
      return lines;
    }
  }

  for (const [key, value] of Object.entries(meta)) {
    if (usedTopLevelKeys.has(key) || isEmptyHighlightValue(value)) continue;
    lines.push(`- ${key}: ${toOneLine(value)}`);
    if (lines.length >= maxEntries) {
      break;
    }
  }

  return lines;
}

function createMetaJsonBlock(meta: Record<string, unknown>, maxChars = 900) {
  const pretty = JSON.stringify(meta, null, 2);
  const clipped = pretty.length > maxChars ? `${pretty.slice(0, maxChars)}\n...[TRUNCATED]` : pretty;
  return "```json\n" + clipped + "\n```";
}

function resolveAuditActionTone(action: string): VisualTone {
  switch (action) {
    case "security_alert":
      return "critical";

    case "admin_login_failed":
    case "admin_setup_failed":
    case "audit_webhook_failed":
    case "security_alert_webhook_failed":
    case "security_alert_email_failed":
      return "danger";

    case "status_changed":
    case "confession_updated":
    case "unpublished":
      return "warning";

    case "admin_session_checked":
      return "info";

    case "admin_login":
    case "admin_logout":
    case "admin_setup_completed":
    case "admin_created":
    case "confession_created":
    case "published":
    case "audit_webhook_delivered":
    case "security_alert_webhook_delivered":
    case "security_alert_email_delivered":
      return "success";

    case "admin_deleted":
    case "confession_deleted":
      return "warning";

    default:
      if (action.endsWith("_failed")) {
        return "danger";
      }
      if (action.endsWith("_delivered") || action.endsWith("_completed") || action.endsWith("_created")) {
        return "success";
      }
      if (action.endsWith("_updated") || action.endsWith("_deleted")) {
        return "warning";
      }
      return "neutral";
  }
}

function resolveAuditActionColor(action: string) {
  return DISCORD_COLORS[resolveAuditActionTone(action)];
}

function colorIntToHex(color: number) {
  return `#${color.toString(16).padStart(6, "0").toUpperCase()}`;
}

function resolveWebhookVisual(action: string): WebhookVisual {
  const tone = resolveAuditActionTone(action);
  const colorInt = DISCORD_COLORS[tone];

  switch (tone) {
    case "critical":
      return {
        tone,
        severity: "critical",
        badge: "[CRITICAL]",
        colorInt,
        colorHex: colorIntToHex(colorInt),
      };
    case "danger":
      return {
        tone,
        severity: "high",
        badge: "[HIGH]",
        colorInt,
        colorHex: colorIntToHex(colorInt),
      };
    case "warning":
      return {
        tone,
        severity: "medium",
        badge: "[MEDIUM]",
        colorInt,
        colorHex: colorIntToHex(colorInt),
      };
    case "info":
      return {
        tone,
        severity: "info",
        badge: "[INFO]",
        colorInt,
        colorHex: colorIntToHex(colorInt),
      };
    case "success":
      return {
        tone,
        severity: "low",
        badge: "[LOW]",
        colorInt,
        colorHex: colorIntToHex(colorInt),
      };
    default:
      return {
        tone,
        severity: "info",
        badge: "[INFO]",
        colorInt,
        colorHex: colorIntToHex(colorInt),
      };
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

function parseRetryAfterMs(value: string | null) {
  if (!value) return undefined;

  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return Math.max(100, Math.round(seconds * 1000));
  }

  const dateMs = Date.parse(value);
  if (Number.isFinite(dateMs)) {
    return Math.max(100, dateMs - Date.now());
  }

  return undefined;
}

function parseDiscordRateLimitMs(headers: Headers) {
  const retryAfter = parseRetryAfterMs(headers.get("retry-after"));
  if (typeof retryAfter === "number") return retryAfter;

  const resetAfterSeconds = Number(headers.get("x-ratelimit-reset-after"));
  if (Number.isFinite(resetAfterSeconds) && resetAfterSeconds >= 0) {
    return Math.max(100, Math.round(resetAfterSeconds * 1000));
  }

  return undefined;
}

async function withRetry(taskName: string, fn: () => Promise<void>, options: RetryOptions) {
  const baseBackoffMs = options.baseBackoffMs ?? 250;
  let attempt = 0;
  let lastError: unknown = null;

  while (attempt <= options.maxRetries) {
    try {
      await fn();
      return;
    } catch (error) {
      lastError = error;
      if (attempt === options.maxRetries) {
        break;
      }

      const retryAfterMs =
        error instanceof RetryableDeliveryError && typeof error.retryAfterMs === "number"
          ? error.retryAfterMs
          : null;

      // Backoff: base, base*2, base*4... unless endpoint gives Retry-After.
      await sleep(retryAfterMs ?? baseBackoffMs * 2 ** attempt);
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
  const sanitizedMeta = redactMeta(payload.meta);
  const highlights = createMetaHighlights(sanitizedMeta, 12);
  const visual = resolveWebhookVisual(payload.action);

  return [
    "Security alert triggered",
    `${visual.badge} Severity: ${visual.severity}`,
    `Color: ${visual.colorHex}`,
    `Audit ID: ${payload.auditId}`,
    `Action: ${payload.action}`,
    `Route: ${payload.method} ${payload.route}`,
    `Request ID: ${payload.requestId}`,
    `IP: ${payload.ip}`,
    `Admin: ${payload.adminEmail || "(none)"}`,
    `Created At: ${payload.createdAt}`,
    "",
    "Meta Highlights:",
    ...(highlights.length > 0 ? highlights : ["- (empty)"]),
    "",
    "Meta:",
    JSON.stringify(sanitizedMeta, null, 2),
  ].join("\n");
}

async function sendWebhookAlert(payload: SecurityAlertDeliveryPayload) {
  const url = process.env.SECURITY_ALERT_WEBHOOK_URL;
  if (!url) return;

  const sanitizedMeta = redactMeta(payload.meta);
  const metaHighlights = createMetaHighlights(sanitizedMeta, 12);
  const visual = resolveWebhookVisual(payload.action);

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
        body: JSON.stringify({
          ...payload,
          meta: sanitizedMeta,
          severity: visual.severity,
          colorHex: visual.colorHex,
          colorInt: visual.colorInt,
          badge: visual.badge,
          metaHighlights,
          metaStyled: {
            highlights: metaHighlights,
            json: createMetaJsonBlock(sanitizedMeta, 1000),
          },
        }),
      },
      ALERT_TIMEOUT_MS
    );

    if (!response.ok) {
      if (response.status >= 500 || response.status === 429) {
        throw new RetryableDeliveryError(
          `Webhook alert delivery failed with status ${response.status}`,
          parseRetryAfterMs(response.headers.get("retry-after"))
        );
      }
      throw new Error(`Webhook alert delivery failed with status ${response.status}`);
    }
  }, { maxRetries: ALERT_MAX_RETRIES, baseBackoffMs: 250 });
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
      if (response.status >= 500 || response.status === 429) {
        throw new RetryableDeliveryError(
          `Email alert delivery failed with status ${response.status}`,
          parseRetryAfterMs(response.headers.get("retry-after"))
        );
      }
      throw new Error(`Email alert delivery failed with status ${response.status}`);
    }
  }, { maxRetries: ALERT_MAX_RETRIES, baseBackoffMs: 300 });
}

function createDiscordEmbed(payload: AuditEventDeliveryPayload) {
  const sanitizedMeta = redactMeta(payload.meta);
  const metaHighlights = createMetaHighlights(sanitizedMeta, 8);
  const visual = resolveWebhookVisual(payload.action);
  const summary = [
    `Action: ${payload.action}`,
    `Request ID: ${payload.requestId}`,
    `Route: ${payload.method} ${payload.route}`,
    `Admin: ${payload.adminEmail || "(none)"}`,
    `IP: ${payload.ip}`,
  ].join("\n");

  return {
    title: `${visual.badge} Audit Event`,
    description: summary,
    color: resolveAuditActionColor(payload.action),
    timestamp: payload.createdAt,
    fields: [
      {
        name: "Severity",
        value: `${visual.severity} (${visual.colorHex})`,
      },
      {
        name: "Meta Highlights",
        value: metaHighlights.length > 0 ? metaHighlights.join("\n") : "- (empty)",
      },
      {
        name: "Meta JSON",
        value: createMetaJsonBlock(sanitizedMeta, 950),
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

  const webhookUrl = new URL(url);
  // Ask Discord to complete request processing before returning.
  webhookUrl.searchParams.set("wait", "true");

  const username = process.env.DISCORD_AUDIT_WEBHOOK_USERNAME || "GCK Audit";
  const avatarUrl = process.env.DISCORD_AUDIT_WEBHOOK_AVATAR_URL || undefined;

  await withRetry("Discord audit webhook delivery", async () => {
    const response = await fetchWithTimeout(
      webhookUrl,
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
      AUDIT_WEBHOOK_TIMEOUT_MS
    );

    if (!response.ok) {
      if (response.status === 429 || response.status >= 500) {
        throw new RetryableDeliveryError(
          `Discord audit delivery failed with status ${response.status}`,
          parseDiscordRateLimitMs(response.headers)
        );
      }
      throw new Error(`Discord audit delivery failed with status ${response.status}`);
    }
  }, { maxRetries: AUDIT_WEBHOOK_MAX_RETRIES, baseBackoffMs: AUDIT_WEBHOOK_BACKOFF_MS });
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
