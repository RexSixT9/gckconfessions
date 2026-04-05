import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectToDatabase } from "@/lib/mongodb";
import { apiError, safeLogError } from "@/lib/api";
import { writeAuditLog } from "@/lib/audit";
import { verifyAdminToken } from "@/lib/auth";
import { COOKIE_NAME, COOKIE_OPTIONS } from "@/lib/constants";
import { clearSessionCookies } from "@/lib/session";
import { runMutatingRouteGuard } from "@/lib/routeGuards";

export async function POST(request: Request) {
  try {
    const guard = await runMutatingRouteGuard(request, {
      requireCsrf: true,
      useArcjet: true,
    });
    if (!guard.ok) {
      if (guard.response.status === 403) {
        const response = guard.response as NextResponse;
        clearSessionCookies(response);
        return response;
      }
      return guard.response;
    }

    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    let adminEmail = "unknown";

    // Verify token and log the logout action
    if (token) {
      try {
        const payload = await verifyAdminToken(token);
        if (payload.sub && payload.email) {
          adminEmail = payload.email;

          await connectToDatabase();
          await writeAuditLog({
            action: "admin_logout",
            request,
            adminEmail,
          });
        }
      } catch (error) {
        safeLogError("Token verification error during logout", error);
        // Continue to clear cookie even if verification fails
      }
    }

    // Clear the authentication cookie
    const redirectUrl = new URL("/", request.url);
    const response = NextResponse.redirect(redirectUrl);
    clearSessionCookies(response);
    response.cookies.set(COOKIE_NAME, "", { ...COOKIE_OPTIONS, maxAge: 0 });

    return response;
  } catch (error) {
    safeLogError("Logout error", error);
    
    // Even if there's an error, still try to clear the cookie
    const redirectUrl = new URL("/", request.url);
    const response = NextResponse.redirect(redirectUrl);
    clearSessionCookies(response);
    response.cookies.set(COOKIE_NAME, "", { ...COOKIE_OPTIONS, maxAge: 0 });

    return response;
  }
}
