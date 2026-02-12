import { NextResponse, type NextRequest } from "next/server";
import { verifyAdminToken } from "@/lib/auth";
import { COOKIE_NAME } from "@/lib/constants";

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminPage = pathname.startsWith("/admin");
  const isAdminApi = pathname.startsWith("/api/admin");
  const isConfessionApi = pathname.startsWith("/api/confessions");
  const isAdminLogin = pathname.startsWith("/adminlogin");
  const isAdminLoginApi = pathname.startsWith("/api/admin/login");
  const isAdminSetupApi = pathname.startsWith("/api/admin/setup");

  if (isAdminLogin || isAdminLoginApi || isAdminSetupApi) {
    return NextResponse.next();
  }

  if (isConfessionApi && request.method === "POST") {
    return NextResponse.next();
  }

  if (isAdminPage || isAdminApi || isConfessionApi) {
    const token = request.cookies.get(COOKIE_NAME)?.value;

    if (!token) {
      if (isAdminPage) {
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = "/adminlogin";
        return NextResponse.redirect(loginUrl);
      }

      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    try {
      const payload = await verifyAdminToken(token);
      if (!payload.sub) {
        throw new Error("Invalid token");
      }
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
  matcher: ["/admin/:path*", "/api/admin/:path*", "/api/confessions/:path*"],
};