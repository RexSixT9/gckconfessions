import { apiOk, safeLogError } from "@/lib/api";
import { writeAuditLog } from "@/lib/audit";
import { checkCspReportLimit, getClientIp } from "@/lib/rateLimit";
import { runMutatingRouteGuard } from "@/lib/routeGuards";

const MAX_CSP_REPORT_BYTES = Number(process.env.CSP_REPORT_MAX_BYTES ?? 16_384);

export async function POST(request: Request) {
  try {
    const guard = await runMutatingRouteGuard(request, {
      enforceOrigin: false,
      useArcjet: false,
      checkBlockedIp: true,
    });
    if (!guard.ok) {
      // Keep a generic 202 response to avoid exposing policy details.
      return apiOk({ ok: false }, 202);
    }

    const ip = guard.ctx.ip || getClientIp(request);
    const rate = await checkCspReportLimit(`csp-report:${ip}`);
    if (!rate.allowed) {
      // Keep 202 to prevent endpoint probing signal, but drop processing.
      return apiOk({ ok: false }, 202);
    }

    const contentLengthHeader = request.headers.get("content-length");
    const contentLength = contentLengthHeader ? Number(contentLengthHeader) : 0;
    if (Number.isFinite(contentLength) && contentLength > MAX_CSP_REPORT_BYTES) {
      return apiOk({ ok: false }, 202);
    }

    const rawBody = await request.text();
    if (rawBody.length > MAX_CSP_REPORT_BYTES) {
      return apiOk({ ok: false }, 202);
    }

    let body: Record<string, unknown> = {};
    if (rawBody) {
      try {
        const parsed = JSON.parse(rawBody) as unknown;
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          body = parsed as Record<string, unknown>;
        }
      } catch {
        body = {};
      }
    }

    await writeAuditLog({
      action: "security_alert",
      request,
      adminEmail: "",
      meta: {
        type: "csp_report",
        report: body,
      },
    });

    return apiOk({ ok: true }, 202);
  } catch (error) {
    safeLogError("CSP report handling failed", error);
    return apiOk({ ok: false }, 202);
  }
}
