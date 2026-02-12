import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectToDatabase } from "@/lib/mongodb";
import { aj } from "@/lib/arcjet";
import { verifyAdminToken } from "@/lib/auth";
import { getClientIp } from "@/lib/rateLimit";
import { COOKIE_NAME, COOKIE_OPTIONS } from "@/lib/constants";
import AuditLog from "@/models/AuditLog";

export async function POST(request: Request) {
  try {
    // Arcjet protection
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
    const token = cookieStore.get(COOKIE_NAME)?.value;

    let adminEmail = "unknown";

    // Verify token and log the logout action
    if (token) {
      try {
        const payload = await verifyAdminToken(token);
        if (payload.sub && payload.email) {
          adminEmail = payload.email;
          
          // Log the logout action
          await connectToDatabase();
          const ip = getClientIp(request);
          await AuditLog.create({
            action: "admin_logout",
            adminEmail,
            ip,
          });
        }
      } catch (error) {
        console.error("Token verification error during logout:", error);
        // Continue to clear cookie even if verification fails
      }
    }

    // Clear the authentication cookie
    const redirectUrl = new URL("/", request.url);
    const response = NextResponse.redirect(redirectUrl);
    
    // Set cookie to expired with all security flags
    response.cookies.set(COOKIE_NAME, "", {
      ...COOKIE_OPTIONS,
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    
    // Even if there's an error, still try to clear the cookie
    const redirectUrl = new URL("/", request.url);
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.set(COOKIE_NAME, "", {
      ...COOKIE_OPTIONS,
      maxAge: 0,
    });

    return response;
  }
}
