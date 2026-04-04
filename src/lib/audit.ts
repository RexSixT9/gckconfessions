import { createHash } from "crypto";
import AuditLog from "@/models/AuditLog";
import { getClientIp } from "@/lib/rateLimit";
import { hashIp } from "@/lib/requestUtils";
import { deliverAuditEvent, deliverSecurityAlert } from "@/lib/alerts";
import { safeLogError } from "@/lib/api";

const SECURITY_ALERT_DEDUPE_WINDOW_MS = Number(process.env.SECURITY_ALERT_DEDUPE_WINDOW_MS ?? 60_000);
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
  | "admin_stats_viewed"
  | "confessions_viewed"
  | "admins_viewed"
  | "audit_dashboard_viewed"
  | "security_alert";

type AuditParams = {
  action: AuditAction;
  request: Request;
  adminEmail?: string;
  confessionId?: string;
  meta?: Record<string, unknown>;
};

function toSerializableMeta(meta: Record<string, unknown>) {
  try {
    return JSON.parse(JSON.stringify(meta)) as Record<string, unknown>;
  } catch {
    return { serializationError: true };
  }
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

export async function writeAuditLog({
  action,
  request,
  adminEmail = "",
  confessionId,
  meta = {},
}: AuditParams) {
  const ip = getClientIp(request);
  const ipHash = hashIp(ip);
  const url = new URL(request.url);
  const requestId = createRequestId(request, ip);
  const userAgent = (request.headers.get("user-agent") ?? "").slice(0, 512);

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
      route: url.pathname,
      method: request.method,
      requestId,
      loggedAt: new Date().toISOString(),
    }),
  });

  const serializableMeta = toSerializableMeta(meta);

  void deliverAuditEvent({
    auditId: String(created._id),
    action,
    requestId,
    route: url.pathname,
    method: request.method,
    ip,
    userAgent,
    adminEmail,
    createdAt: new Date().toISOString(),
    meta: serializableMeta,
  }).catch((error) => {
    safeLogError("Audit event delivery error", error);
  });

  if (action === "security_alert") {
    const dedupeKey = createSecurityAlertDedupeKey(
      url.pathname,
      request.method,
      ip,
      adminEmail,
      serializableMeta
    );

    if (!shouldDeliverSecurityAlert(dedupeKey)) {
      return created;
    }

    void deliverSecurityAlert({
      auditId: String(created._id),
      action,
      requestId,
      route: url.pathname,
      method: request.method,
      ip,
      userAgent,
      adminEmail,
      createdAt: new Date().toISOString(),
      meta: serializableMeta,
    }).catch((error) => {
      safeLogError("Security alert delivery error", error);
    });
  }

  return created;
}