import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAdminToken } from "@/lib/auth";
import { COOKIE_NAME } from "@/lib/constants";

/**
 * GET /api/admin/check
 * Verifies if the user has a valid admin token
 * Returns 200 if valid, 401 if invalid/missing
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json(
        { error: "No authentication token found." },
        { status: 401 }
      );
    }

    // Verify the token is valid
    const payload = await verifyAdminToken(token);

    if (!payload.sub) {
      return NextResponse.json(
        { error: "Invalid token." },
        { status: 401 }
      );
    }

    // Token is valid
    return NextResponse.json({ authenticated: true, email: payload.email }, { status: 200 });
  } catch (error) {
    console.error("Auth check error:", error);
    return NextResponse.json(
      { error: "Authentication check failed." },
      { status: 401 }
    );
  }
}
