import { cookies } from "next/headers";
import { verifyAdminToken } from "@/lib/auth";
import { COOKIE_NAME } from "@/lib/constants";
import { ensureCsrfCookie } from "@/lib/csrf";
import { writeAuditLog } from "@/lib/audit";
import { apiOk, safeLogError } from "@/lib/api";

/**
 * GET /api/admin/check
 * Verifies if the user has a valid admin token
 * Returns 200 with authenticated state for login page checks
 */
export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) {
      return apiOk({ authenticated: false }, 200, { "Cache-Control": "no-store" });
    }

    // Verify the token is valid
    const payload = await verifyAdminToken(token);

    if (!payload.sub) {
      return apiOk({ authenticated: false }, 200, { "Cache-Control": "no-store" });
    }

    await writeAuditLog({
      action: "admin_session_checked",
      request,
      adminEmail: payload.email,
      meta: {
        authenticated: true,
      },
    }).catch((error) => {
      safeLogError("AuditLog write failed (admin check)", error);
    });

    // Token is valid
    const response = apiOk({ authenticated: true, email: payload.email }, 200, {
      "Cache-Control": "no-store",
    });
    await ensureCsrfCookie(response);
    return response;
  } catch (error) {
    await writeAuditLog({
      action: "admin_session_checked",
      request,
      meta: {
        authenticated: false,
        reason: "token_verification_error",
      },
    }).catch(() => {
      // Do not block auth-check response on logging path.
    });

    safeLogError("Auth check error", error);
    return apiOk({ authenticated: false }, 200, { "Cache-Control": "no-store" });
  }
}
