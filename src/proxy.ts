import { NextResponse, type NextRequest } from "next/server";
import { verifyAdminToken } from "@/lib/auth";
import { COOKIE_NAME, SESSION_ACTIVITY_COOKIE } from "@/lib/constants";
import { clearSessionCookies, isSessionIdle, touchSessionActivity } from "@/lib/session";

function normalizeIp(value: string | null) {
  if (!value) return "unknown";
  const candidate = value.split(",")[0]?.trim() ?? "unknown";
  return candidate.slice(0, 64) || "unknown";
}

function getClientIp(request: NextRequest) {
  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  if (cfConnectingIp) return normalizeIp(cfConnectingIp);

  const vercelForwarded = request.headers.get("x-vercel-forwarded-for");
  if (vercelForwarded) return normalizeIp(vercelForwarded);

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return normalizeIp(forwarded);

  return normalizeIp(request.headers.get("x-real-ip"));
}

function isAdminIpAllowed(request: NextRequest) {
  const allowedRaw = process.env.ADMIN_IP_ALLOWLIST ?? "";
  const allowList = allowedRaw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (allowList.length === 0) return true;

  const clientIp = getClientIp(request);
  return allowList.includes(clientIp);
}

function buildCsp(nonce: string, enforce: boolean) {
  const vercelPreviewOrigins = process.env.VERCEL_ENV === "preview" ? ["https://vercel.live"] : [];
  const connectSrc = ["'self'", ...vercelPreviewOrigins].join(" ");

  const directives = [
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
  ];

  if (enforce) {
    directives.push("upgrade-insecure-requests");
  }

  return directives.join("; ");
}

function normalizePermissionsPolicy(policyValue: string) {
  return policyValue
    .split(",")
    .map((directive) => directive.trim())
    .filter((directive) => directive.length > 0)
    .filter((directive) => !directive.toLowerCase().startsWith("browsing-topics"))
    .join(", ");
}

function applySecurityHeaders(response: NextResponse, nonce: string) {
  const enforceCsp = process.env.CSP_ENFORCE === "true";
  const cspHeaderKey = enforceCsp
    ? "Content-Security-Policy"
    : "Content-Security-Policy-Report-Only";

  // Ask browsers for safe client hints to improve anti-abuse telemetry on backend actions.
  response.headers.set(
    "Accept-CH",
    [
      "Sec-CH-UA",
      "Sec-CH-UA-Mobile",
      "Sec-CH-UA-Platform",
      "Sec-CH-UA-Model",
      "Sec-CH-UA-Platform-Version",
      "Sec-CH-UA-Arch",
      "Sec-CH-UA-Bitness",
      "Sec-CH-UA-Full-Version-List",
      "Sec-CH-UA-Form-Factors",
      "Sec-CH-UA-WoW64",
      "Device-Memory",
      "DPR",
      "Viewport-Width",
    ].join(", ")
  );

  response.headers.set(cspHeaderKey, buildCsp(nonce, enforceCsp));
  response.headers.set("x-nonce", nonce);
  response.headers.set("Referrer-Policy", process.env.REFERRER_POLICY ?? "strict-origin-when-cross-origin");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Permitted-Cross-Domain-Policies", "none");
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set("Cross-Origin-Resource-Policy", "same-origin");
  response.headers.set("Origin-Agent-Cluster", "?1");
  const permissionsPolicyRaw =
    process.env.PERMISSIONS_POLICY ??
    "camera=(), microphone=(), geolocation=(), fullscreen=(self)";
  const permissionsPolicy = normalizePermissionsPolicy(permissionsPolicyRaw);
  if (permissionsPolicy) {
    response.headers.set("Permissions-Policy", permissionsPolicy);
  }

  if (process.env.NODE_ENV === "production") {
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }

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
  const isAdminSurface =
    isAdminPage ||
    isAdminApi ||
    isAdminLogin ||
    isAdminLoginApi ||
    isAdminSetupApi ||
    isAdminCheckApi;

  if (isAdminSurface && !isAdminIpAllowed(request)) {
    if (isAdminApi || isAdminLoginApi || isAdminSetupApi || isAdminCheckApi) {
      const response = NextResponse.json({ error: "Forbidden." }, { status: 403 });
      clearSessionCookies(response);
      return applySecurityHeaders(response, nonce);
    }

    const response = new NextResponse("Forbidden", { status: 403 });
    clearSessionCookies(response);
    return applySecurityHeaders(response, nonce);
  }

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