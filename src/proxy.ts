import { NextResponse, type NextRequest } from "next/server";
import { verifyAdminToken } from "@/lib/auth";
import { COOKIE_NAME, SESSION_ACTIVITY_COOKIE } from "@/lib/constants";
import { clearSessionCookies, isSessionIdle, touchSessionActivity } from "@/lib/session";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Use precise matching: /admin starts /admin/ or is exactly /admin.
  // This avoids /adminlogin being caught by a naive startsWith("/admin") check.
  const isAdminPage = pathname === "/admin" || pathname.startsWith("/admin/");
  const isAdminApi = pathname.startsWith("/api/admin/");
  const isConfessionApi = pathname.startsWith("/api/confessions");
  const isAdminLogin =
    pathname === "/adminlogin" || pathname.startsWith("/adminlogin/");
  const isAdminLoginApi = pathname === "/api/admin/login";
  const isAdminSetupApi = pathname === "/api/admin/setup";
  const isAdminCheckApi = pathname === "/api/admin/check";

  if (isAdminLogin || isAdminLoginApi || isAdminSetupApi || isAdminCheckApi) {
    return NextResponse.next();
  }

  if (isConfessionApi && request.method === "POST") {
    return NextResponse.next();
  }

  if (isAdminPage || isAdminApi || isConfessionApi) {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    const sessionActivity = request.cookies.get(SESSION_ACTIVITY_COOKIE)?.value;

    if (!token) {
      if (isAdminPage) {
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = "/adminlogin";
        return NextResponse.redirect(loginUrl);
      }

      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    try {
      if (isSessionIdle(sessionActivity)) {
        if (isAdminPage) {
          const loginUrl = request.nextUrl.clone();
          loginUrl.pathname = "/adminlogin";
          const response = NextResponse.redirect(loginUrl);
          clearSessionCookies(response);
          return response;
        }

        const response = NextResponse.json({ error: "Session expired due to inactivity." }, { status: 401 });
        clearSessionCookies(response);
        return response;
      }

      const payload = await verifyAdminToken(token);
      if (!payload.sub) {
        throw new Error("Invalid token");
      }

      const response = NextResponse.next();
      touchSessionActivity(response);
      return response;
    } catch {
      if (isAdminPage) {
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = "/adminlogin";
        return NextResponse.redirect(loginUrl);
      }

      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/api/confessions", "/api/confessions/:path*"],
};