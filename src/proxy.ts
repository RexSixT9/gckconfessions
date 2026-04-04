import { NextResponse, type NextRequest } from "next/server";
import { verifyAdminToken } from "@/lib/auth";
import { COOKIE_NAME, SESSION_ACTIVITY_COOKIE } from "@/lib/constants";
import { clearSessionCookies, isSessionIdle, touchSessionActivity } from "@/lib/session";

function buildCsp(nonce: string) {
  const vercelPreviewOrigins = process.env.VERCEL_ENV === "preview" ? ["https://vercel.live"] : [];
  const connectSrc = ["'self'", ...vercelPreviewOrigins].join(" ");

  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https://fonts.gstatic.com",
    `connect-src ${connectSrc}`,
    "object-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join("; ");
}

function applySecurityHeaders(response: NextResponse, nonce: string) {
  const cspHeaderKey = process.env.CSP_ENFORCE === "true"
    ? "Content-Security-Policy"
    : "Content-Security-Policy-Report-Only";

  response.headers.set(cspHeaderKey, buildCsp(nonce));
  response.headers.set("x-nonce", nonce);

  if (process.env.CSP_ENFORCE !== "true") {
    response.headers.set(
      "Report-To",
      '{"group":"csp-endpoint","max_age":10886400,"endpoints":[{"url":"/api/security/csp-report"}]}'
    );
    response.headers.set("Reporting-Endpoints", 'csp-endpoint="/api/security/csp-report"');
  }

  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const nonce = btoa(crypto.randomUUID());

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  const nextResponse = () =>
    applySecurityHeaders(
      NextResponse.next({
        request: { headers: requestHeaders },
      }),
      nonce
    );

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
    return nextResponse();
  }

  if (isConfessionApi && request.method === "POST") {
    return nextResponse();
  }

  if (isAdminPage || isAdminApi || isConfessionApi) {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    const sessionActivity = request.cookies.get(SESSION_ACTIVITY_COOKIE)?.value;

    if (!token) {
      if (isAdminPage) {
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = "/adminlogin";
        const response = NextResponse.redirect(loginUrl);
        clearSessionCookies(response);
        return applySecurityHeaders(response, nonce);
      }

      const response = NextResponse.json({ error: "Unauthorized." }, { status: 401 });
      clearSessionCookies(response);
      return applySecurityHeaders(response, nonce);
    }

    try {
      if (isSessionIdle(sessionActivity)) {
        if (isAdminPage) {
          const loginUrl = request.nextUrl.clone();
          loginUrl.pathname = "/adminlogin";
          const response = NextResponse.redirect(loginUrl);
          clearSessionCookies(response);
          return applySecurityHeaders(response, nonce);
        }

        const response = NextResponse.json({ error: "Session expired due to inactivity." }, { status: 401 });
        clearSessionCookies(response);
        return applySecurityHeaders(response, nonce);
      }

      const payload = await verifyAdminToken(token);
      if (!payload.sub) {
        throw new Error("Invalid token");
      }

      const response = NextResponse.next({
        request: { headers: requestHeaders },
      });
      touchSessionActivity(response);
      return applySecurityHeaders(response, nonce);
    } catch {
      if (isAdminPage) {
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = "/adminlogin";
        const response = NextResponse.redirect(loginUrl);
        clearSessionCookies(response);
        return applySecurityHeaders(response, nonce);
      }

      const response = NextResponse.json({ error: "Unauthorized." }, { status: 401 });
      clearSessionCookies(response);
      return applySecurityHeaders(response, nonce);
    }
  }

  return nextResponse();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};