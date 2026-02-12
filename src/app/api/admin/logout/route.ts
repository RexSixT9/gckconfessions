import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { aj } from "@/lib/arcjet";
import { verifyAdminToken } from "@/lib/auth";

export async function POST(request: Request) {
  let arcjetDecision;
  try {
    arcjetDecision = await aj.protect(request);
  } catch (arcjetError) {
    console.error("Arcjet error:", arcjetError);
    arcjetDecision = null;
  }

  if (arcjetDecision?.isDenied()) {
    return NextResponse.json({ error: "Request blocked." }, { status: 403 });
  }

  const cookieStore = await cookies();
  const token = cookieStore.get("gck_admin_token")?.value;

  if (token) {
    try {
      const payload = await verifyAdminToken(token);
      if (!payload.sub) {
        throw new Error("Invalid token");
      }
    } catch {
      // Continue to clear cookie and redirect.
    }
  }

  const redirectUrl = new URL("/", request.url);
  const response = NextResponse.redirect(redirectUrl);
  response.cookies.set("gck_admin_token", "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
