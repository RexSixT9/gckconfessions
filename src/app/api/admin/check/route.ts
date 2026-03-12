import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAdminToken } from "@/lib/auth";
import { COOKIE_NAME } from "@/lib/constants";

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
      return NextResponse.json(
        { authenticated: false },
        { status: 200, headers: { "Cache-Control": "no-store" } }
      );
    }

    // Verify the token is valid
    const payload = await verifyAdminToken(token);

    if (!payload.sub) {
      return NextResponse.json(
        { authenticated: false },
        { status: 200, headers: { "Cache-Control": "no-store" } }
      );
    }

    // Token is valid
    return NextResponse.json(
      { authenticated: true, email: payload.email },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Auth check error:", error);
    return NextResponse.json(
      { authenticated: false },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  }
}
