import { cookies } from "next/headers";
import { verifyAdminToken } from "@/lib/auth";
import { COOKIE_NAME } from "@/lib/constants";
import { ensureCsrfCookie } from "@/lib/csrf";
import { apiOk, safeLogError } from "@/lib/api";

/**
 * GET /api/admin/check
 * Verifies if the user has a valid admin token
 * Returns 200 with authenticated state for login page checks
 */
export async function GET() {
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

    // Token is valid
    const response = apiOk({ authenticated: true, email: payload.email }, 200, {
      "Cache-Control": "no-store",
    });
    await ensureCsrfCookie(response);
    return response;
  } catch (error) {
    safeLogError("Auth check error", error);
    return apiOk({ authenticated: false }, 200, { "Cache-Control": "no-store" });
  }
}
