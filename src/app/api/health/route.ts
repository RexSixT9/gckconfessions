import { apiOk } from "@/lib/api";
import { safeCompare } from "@/lib/requestUtils";

function canAccessDetailedDiagnostics(request: Request) {
  const expected = process.env.HEALTH_DIAGNOSTICS_SECRET?.trim();
  if (!expected) return false;

  const provided = request.headers.get("x-health-diagnostics-secret")?.trim();
  if (!provided) return false;
  return safeCompare(provided, expected);
}

export async function GET(request: Request) {
  const base = {
    status: "ok",
    timestamp: new Date().toISOString(),
  };

  if (!canAccessDetailedDiagnostics(request)) {
    return apiOk(base, 200, { "Cache-Control": "no-store" });
  }

  return apiOk(
    {
      ...base,
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "unknown",
      version: process.env.APP_VERSION || "1.0.0",
    },
    200,
    { "Cache-Control": "no-store" }
  );
}
