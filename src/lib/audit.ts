import { createHash } from "crypto";
import AuditLog from "@/models/AuditLog";
import { getClientIp } from "@/lib/rateLimit";
import { getClientContext, getRequestFingerprint, hashIp, type ClientContext } from "@/lib/requestUtils";
import { deliverAuditEvent, deliverSecurityAlert, type DeliveryOutcome } from "@/lib/alerts";
import { safeLogError } from "@/lib/api";

const SECURITY_ALERT_DEDUPE_WINDOW_MS = Number(process.env.SECURITY_ALERT_DEDUPE_WINDOW_MS ?? 60_000);
const SYNC_WEBHOOK_ACTIONS_DEFAULT = [
  "security_alert",
  "admin_login_failed",
  "admin_setup_failed",
  "confession_deleted",
  "admin_deleted",
];
const AUDIT_WEBHOOK_SYNC_ACTIONS = new Set(
  (process.env.AUDIT_WEBHOOK_SYNC_ACTIONS ?? SYNC_WEBHOOK_ACTIONS_DEFAULT.join(","))
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
);
const AUDIT_WEBHOOK_TIMEOUT_MS = Number(process.env.AUDIT_WEBHOOK_TIMEOUT_MS ?? 1800);
const AUDIT_WEBHOOK_MAX_RETRIES = Number(process.env.AUDIT_WEBHOOK_MAX_RETRIES ?? 1);
const AUDIT_WEBHOOK_BACKOFF_MS = Number(process.env.AUDIT_WEBHOOK_BACKOFF_MS ?? 120);

function calculateAuditWebhookSyncBudgetMs() {
  const attempts = Math.max(1, Math.floor(AUDIT_WEBHOOK_MAX_RETRIES) + 1);
  const timeoutMs = Math.max(300, Math.floor(AUDIT_WEBHOOK_TIMEOUT_MS));
  const backoffMs = Math.max(20, Math.floor(AUDIT_WEBHOOK_BACKOFF_MS));
  const retryCount = attempts - 1;
  const totalBackoff = retryCount > 0 ? backoffMs * (2 ** retryCount - 1) : 0;

  // Buffer leaves room for JSON serialization and DB write of delivery status logs.
  return timeoutMs * attempts + totalBackoff + 750;
}

const AUDIT_WEBHOOK_SYNC_BUDGET_MS = Number(
  process.env.AUDIT_WEBHOOK_SYNC_BUDGET_MS ?? calculateAuditWebhookSyncBudgetMs()
);
const SECURITY_ALERT_SYNC_BUDGET_MS = Number(process.env.SECURITY_ALERT_SYNC_BUDGET_MS ?? 4500);
const recentSecurityAlertDeliveries = new Map<string, number>();

type AuditAction =
  | "admin_login"
  | "admin_login_failed"
  | "admin_logout"
  | "admin_session_checked"
  | "admin_setup_completed"
  | "admin_setup_failed"
  | "admin_created"
  | "admin_deleted"
  | "confession_created"
  | "confession_updated"
  | "confession_deleted"
  | "status_changed"
  | "published"
  | "unpublished"
  // Retained for compatibility with historical records; route-level writes are disabled for now.
  | "admin_stats_viewed"
  | "confessions_viewed"
  | "admins_viewed"
  | "audit_dashboard_viewed"
  | "security_alert"
  | "audit_webhook_delivered"
  | "audit_webhook_failed"
  | "security_alert_webhook_delivered"
  | "security_alert_webhook_failed"
  | "security_alert_email_delivered"
  | "security_alert_email_failed";

type AuditParams = {
  action: AuditAction;
  request: Request;
  adminEmail?: string;
  confessionId?: string;
  meta?: Record<string, unknown>;
};

const INTERNAL_DELIVERY_ACTIONS = new Set<AuditAction>([
  "audit_webhook_delivered",
  "audit_webhook_failed",
  "security_alert_webhook_delivered",
  "security_alert_webhook_failed",
  "security_alert_email_delivered",
  "security_alert_email_failed",
]);

function toSerializableMeta(meta: Record<string, unknown>) {
  try {
    return JSON.parse(JSON.stringify(meta)) as Record<string, unknown>;
  } catch {
    return { serializationError: true };
  }
}

function trimHeader(value: string | null, max = 160) {
  if (!value) return "";
  return value.slice(0, max);
}

function toOrigin(value: string | null) {
  if (!value) return "";
  try {
    return new URL(value).origin;
  } catch {
    return "";
  }
}

function parseContentLength(value: string | null) {
  if (!value) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function getPrimaryLanguage(value: string | null) {
  if (!value) return "";
  return value.split(",")[0]?.trim().slice(0, 24) ?? "";
}

function getUniqueQueryKeys(url: URL) {
  const keys = Array.from(new Set(Array.from(url.searchParams.keys())));
  return keys.slice(0, 25);
}

function getForwardedForCount(value: string | null) {
  if (!value) return 0;
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean).length;
}

function parseBooleanHint(value: string | null) {
  if (!value) return "unknown";
  if (value.includes("?1") || value === "1" || value.toLowerCase() === "true") return "true";
  if (value.includes("?0") || value === "0" || value.toLowerCase() === "false") return "false";
  return "unknown";
}

function parsePositiveNumber(value: string | null) {
  if (!value) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function hasAutomationMarkers(userAgent: string) {
  return /headless|selenium|playwright|puppeteer|phantomjs|webdriver|curl\//i.test(userAgent);
}

function getRequestAnomalyFlags({
  request,
  clientContext,
  queryKeyCount,
  forwardedForCount,
  contentLength,
  secChUaMobile,
}: {
  request: Request;
  clientContext: ClientContext;
  queryKeyCount: number;
  forwardedForCount: number;
  contentLength: number;
  secChUaMobile: string;
}) {
  const flags: string[] = [];

  if (clientContext.deviceType === "bot") flags.push("ua_bot_signature");
  if (hasAutomationMarkers(clientContext.userAgent)) flags.push("automation_signature");
  if (forwardedForCount > 2) flags.push("multi_hop_forwarding");
  if (queryKeyCount > 12) flags.push("high_query_key_count");
  if (contentLength > 80_000) flags.push("large_payload");

  const hasFetchMetadata = Boolean(
    request.headers.get("sec-fetch-site") ||
      request.headers.get("sec-fetch-mode") ||
      request.headers.get("sec-fetch-dest")
  );

  if (clientContext.deviceType !== "bot" && clientContext.browser !== "api-client" && !hasFetchMetadata) {
    flags.push("missing_fetch_metadata");
  }

  if (secChUaMobile === "true" && clientContext.deviceType === "desktop") {
    flags.push("mobile_hint_ua_mismatch");
  }
  if (secChUaMobile === "false" && (clientContext.deviceType === "mobile" || clientContext.deviceType === "tablet")) {
    flags.push("desktop_hint_ua_mismatch");
  }

  return flags.slice(0, 12);
}

function getRequestContext(request: Request, url: URL, ip: string, clientContext: ClientContext) {
  const queryKeys = getUniqueQueryKeys(url);
  const forwardedForCount = getForwardedForCount(request.headers.get("x-forwarded-for"));
  const contentLength = parseContentLength(request.headers.get("content-length"));
  const secChUaMobile = parseBooleanHint(request.headers.get("sec-ch-ua-mobile"));
  const deviceMemoryGb = parsePositiveNumber(request.headers.get("device-memory"));
  const dpr = parsePositiveNumber(request.headers.get("dpr"));
  const viewportWidth = parsePositiveNumber(request.headers.get("viewport-width"));
  const headerFingerprint = getRequestFingerprint(request, ip);
  const anomalyFlags = getRequestAnomalyFlags({
    request,
    clientContext,
    queryKeyCount: queryKeys.length,
    forwardedForCount,
    contentLength,
    secChUaMobile,
  });

  return {
    requestContextVersion: 1,
    fingerprintVersion: 1,
    headerFingerprint,
    protocol: url.protocol.replace(":", ""),
    host: url.host,
    origin: toOrigin(request.headers.get("origin")),
    referrerOrigin: toOrigin(request.headers.get("referer") ?? request.headers.get("referrer")),
    queryKeyCount: queryKeys.length,
    queryKeys,
    contentType: trimHeader(request.headers.get("content-type"), 80),
    contentLength,
    acceptLanguage: getPrimaryLanguage(request.headers.get("accept-language")),
    secFetchSite: trimHeader(request.headers.get("sec-fetch-site"), 24),
    secFetchMode: trimHeader(request.headers.get("sec-fetch-mode"), 24),
    secFetchDest: trimHeader(request.headers.get("sec-fetch-dest"), 24),
    secChUaMobile,
    secChUaPlatform: trimHeader(request.headers.get("sec-ch-ua-platform"), 32),
    secChUaModel: trimHeader(request.headers.get("sec-ch-ua-model"), 80),
    secChUaArch: trimHeader(request.headers.get("sec-ch-ua-arch"), 32),
    secChUaBitness: trimHeader(request.headers.get("sec-ch-ua-bitness"), 16),
    secChUaPlatformVersion: trimHeader(request.headers.get("sec-ch-ua-platform-version"), 24),
    secChUaFullVersionList: trimHeader(request.headers.get("sec-ch-ua-full-version-list"), 160),
    secChUaFormFactors: trimHeader(request.headers.get("sec-ch-ua-form-factors"), 80),
    secChUaWow64: parseBooleanHint(request.headers.get("sec-ch-ua-wow64")),
    deviceMemoryGb,
    dpr,
    viewportWidth,
    deviceType: clientContext.deviceType,
    browser: clientContext.browser,
    os: clientContext.os,
    model: clientContext.model,
    platform: clientContext.platform,
    manufacturer: clientContext.manufacturer,
    manufacturerConfidence: clientContext.manufacturerConfidence,
    isKnownApiClient: clientContext.browser === "api-client",
    hasAuthorizationHeader: Boolean(request.headers.get("authorization")),
    hasCookieHeader: Boolean(request.headers.get("cookie")),
    forwardedForCount,
    isForwarded: forwardedForCount > 0,
    anomalyFlags,
    anomalyScore: anomalyFlags.length,
  };
}

function createRequestId(request: Request, ip: string) {
  return createHash("sha256")
    .update(`${request.method}|${new URL(request.url).pathname}|${ip}|${request.headers.get("user-agent") ?? ""}`)
    .digest("hex")
    .slice(0, 20);
}

function createSecurityAlertDedupeKey(
  route: string,
  method: string,
  ip: string,
  adminEmail: string,
  meta: Record<string, unknown>
) {
  const type = typeof meta.type === "string" ? meta.type : "unknown";
  return createHash("sha256")
    .update(`${type}|${route}|${method}|${ip}|${adminEmail}`)
    .digest("hex")
    .slice(0, 24);
}

function shouldDeliverSecurityAlert(dedupeKey: string) {
  const now = Date.now();
  const lastSent = recentSecurityAlertDeliveries.get(dedupeKey);
  if (lastSent && now - lastSent < SECURITY_ALERT_DEDUPE_WINDOW_MS) {
    return false;
  }

  recentSecurityAlertDeliveries.set(dedupeKey, now);

  // Opportunistic cleanup to avoid unbounded growth.
  if (recentSecurityAlertDeliveries.size > 5000) {
    for (const [key, ts] of recentSecurityAlertDeliveries.entries()) {
      if (now - ts > SECURITY_ALERT_DEDUPE_WINDOW_MS * 2) {
        recentSecurityAlertDeliveries.delete(key);
      }
    }
  }

  return true;
}

function mapDeliveryOutcomeToAction(outcome: DeliveryOutcome): AuditAction {
  switch (outcome.channel) {
    case "audit_event_discord_webhook":
      return outcome.delivered ? "audit_webhook_delivered" : "audit_webhook_failed";
    case "security_alert_webhook":
      return outcome.delivered ? "security_alert_webhook_delivered" : "security_alert_webhook_failed";
    case "security_alert_email":
      return outcome.delivered ? "security_alert_email_delivered" : "security_alert_email_failed";
  }
}

function withDeadline<T>(promise: Promise<T>, timeoutMs: number, label: string) {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    return promise;
  }

  return Promise.race<T>([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
    }),
  ]);
}

function shouldSyncAuditWebhook(action: AuditAction) {
  return AUDIT_WEBHOOK_SYNC_ACTIONS.has(action);
}

async function runAuditWebhookFlow({
  action,
  auditId,
  requestId,
  route,
  method,
  ip,
  userAgent,
  adminEmail,
  createdAt,
  serializableMeta,
  confessionId,
  ipHash,
}: {
  action: AuditAction;
  auditId: string;
  requestId: string;
  route: string;
  method: string;
  ip: string;
  userAgent: string;
  adminEmail: string;
  createdAt: string;
  serializableMeta: Record<string, unknown>;
  confessionId?: string;
  ipHash: string;
}) {
  const outcomes = await deliverAuditEvent({
    auditId,
    action,
    requestId,
    route,
    method,
    ip,
    userAgent,
    adminEmail,
    createdAt,
    meta: serializableMeta,
  });

  await writeDeliveryAuditLogs({
    outcomes,
    sourceAction: action,
    adminEmail,
    confessionId,
    ip,
    ipHash,
    userAgent,
    requestId,
    route,
    method,
  });
}

async function runSecurityAlertFlow({
  auditId,
  requestId,
  route,
  method,
  ip,
  userAgent,
  adminEmail,
  createdAt,
  serializableMeta,
  confessionId,
  ipHash,
}: {
  auditId: string;
  requestId: string;
  route: string;
  method: string;
  ip: string;
  userAgent: string;
  adminEmail: string;
  createdAt: string;
  serializableMeta: Record<string, unknown>;
  confessionId?: string;
  ipHash: string;
}) {
  const outcomes = await deliverSecurityAlert({
    auditId,
    action: "security_alert",
    requestId,
    route,
    method,
    ip,
    userAgent,
    adminEmail,
    createdAt,
    meta: serializableMeta,
  });

  await writeDeliveryAuditLogs({
    outcomes,
    sourceAction: "security_alert",
    adminEmail,
    confessionId,
    ip,
    ipHash,
    userAgent,
    requestId,
    route,
    method,
  });
}

async function writeDeliveryAuditLogs({
  outcomes,
  sourceAction,
  adminEmail,
  confessionId,
  ip,
  ipHash,
  userAgent,
  requestId,
  route,
  method,
}: {
  outcomes: DeliveryOutcome[];
  sourceAction: AuditAction;
  adminEmail: string;
  confessionId?: string;
  ip: string;
  ipHash: string;
  userAgent: string;
  requestId: string;
  route: string;
  method: string;
}) {
  const writes = outcomes.map((outcome) =>
    AuditLog.create({
      action: mapDeliveryOutcomeToAction(outcome),
      adminEmail,
      confessionId,
      ip,
      ipHash,
      userAgent,
      requestId,
      meta: toSerializableMeta({
        sourceAction,
        deliveryChannel: outcome.channel,
        delivered: outcome.delivered,
        deliveryError: outcome.error ? String(outcome.error).slice(0, 600) : "",
        route,
        method,
        loggedAt: new Date().toISOString(),
      }),
    })
  );

  const results = await Promise.allSettled(writes);
  for (const result of results) {
    if (result.status === "rejected") {
      safeLogError("Audit delivery result write failed", result.reason);
    }
  }
}

export async function writeAuditLog({
  action,
  request,
  adminEmail = "",
  confessionId,
  meta = {},
}: AuditParams) {
  const ip = getClientIp(request);
  const clientContext = getClientContext(request, ip);
  const ipHash = hashIp(ip);
  const url = new URL(request.url);
  const requestId = createRequestId(request, ip);
  const userAgent = clientContext.userAgent;
  const requestContext = getRequestContext(request, url, ip, clientContext);

  const created = await AuditLog.create({
    action,
    adminEmail,
    confessionId,
    ip,
    ipHash,
    userAgent,
    requestId,
    meta: toSerializableMeta({
      ...meta,
      requestContext,
      route: url.pathname,
      method: request.method,
      requestId,
      loggedAt: new Date().toISOString(),
    }),
  });

  const serializableMeta = toSerializableMeta({
    ...meta,
    requestContext,
  });

  if (INTERNAL_DELIVERY_ACTIONS.has(action)) {
    return created;
  }

  const auditId = String(created._id);
  const createdAt = new Date().toISOString();
  const route = url.pathname;
  const method = request.method;

  const auditWebhookFlow = runAuditWebhookFlow({
    action,
    auditId,
    requestId,
    route,
    method,
    ip,
    userAgent,
    adminEmail,
    createdAt,
    serializableMeta,
    confessionId,
    ipHash,
  });

  if (shouldSyncAuditWebhook(action)) {
    try {
      await withDeadline(auditWebhookFlow, AUDIT_WEBHOOK_SYNC_BUDGET_MS, "Audit webhook delivery");
    } catch (error) {
      safeLogError("Audit event delivery error", error);
    }
  } else {
    void auditWebhookFlow.catch((error) => {
      safeLogError("Audit event delivery error", error);
    });
  }

  if (action === "security_alert") {
    const dedupeKey = createSecurityAlertDedupeKey(
      route,
      method,
      ip,
      adminEmail,
      serializableMeta
    );

    if (!shouldDeliverSecurityAlert(dedupeKey)) {
      return created;
    }

    const securityAlertFlow = runSecurityAlertFlow({
      auditId,
      requestId,
      route,
      method,
      ip,
      userAgent,
      adminEmail,
      createdAt,
      serializableMeta,
      confessionId,
      ipHash,
    });

    try {
      await withDeadline(securityAlertFlow, SECURITY_ALERT_SYNC_BUDGET_MS, "Security alert delivery");
    } catch (error) {
      safeLogError("Security alert delivery error", error);
    }
  }

  return created;
}