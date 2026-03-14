import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public service blocks any attempt to access admin paths.
  if (
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname === "/adminlogin" ||
    pathname.startsWith("/adminlogin/") ||
    pathname.startsWith("/api/admin/")
  ) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/adminlogin/:path*", "/api/admin/:path*"],
};