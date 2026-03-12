import { createHash } from "crypto";
import AuditLog from "@/models/AuditLog";
import { getClientIp } from "@/lib/rateLimit";

type AuditAction =
  | "admin_login"
  | "admin_login_failed"
  | "admin_logout"
  | "admin_created"
  | "admin_deleted"
  | "confession_created"
  | "confession_updated"
  | "confession_deleted"
  | "status_changed"
  | "published"
  | "unpublished";

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

export async function writeAuditLog({
  action,
  request,
  adminEmail = "",
  confessionId,
  meta = {},
}: AuditParams) {
  const ip = getClientIp(request);
  const url = new URL(request.url);
  const requestId = createRequestId(request, ip);
  const userAgent = (request.headers.get("user-agent") ?? "").slice(0, 512);

  return AuditLog.create({
    action,
    adminEmail,
    confessionId,
    ip,
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
}