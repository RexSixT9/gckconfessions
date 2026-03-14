import { NextResponse, type NextRequest } from "next/server";
import { verifyAdminToken } from "@/lib/auth";
import { COOKIE_NAME, SESSION_ACTIVITY_COOKIE } from "@/lib/constants";
import { clearSessionCookies, isSessionIdle, touchSessionActivity } from "@/lib/session";

function parseList(raw: string | undefined) {
  return (raw ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

function readClientIp(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for") ?? "";
  const first = forwarded.split(",")[0]?.trim();
  if (first) return first;
  return request.headers.get("x-real-ip")?.trim() ?? "";
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProd = process.env.NODE_ENV === "production";
  const allowedHosts = parseList(process.env.ADMIN_ALLOWED_HOSTS);
  const allowedIps = parseList(process.env.ADMIN_ALLOWED_IPS);

  if (isProd && allowedHosts.length > 0) {
    const host = (request.headers.get("host") ?? "").toLowerCase();
    if (!allowedHosts.includes(host)) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
  }

  if (isProd && allowedIps.length > 0) {
    const ip = readClientIp(request).toLowerCase();
    if (!ip || !allowedIps.includes(ip)) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }
  }

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
  const setupEnabled = process.env.ADMIN_SETUP_ENABLED === "true";

  if (isProd && isAdminSetupApi && !setupEnabled) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  if (isAdminLogin || isAdminLoginApi || isAdminSetupApi || isAdminCheckApi) {
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