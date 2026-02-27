import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";
import { aj } from "@/lib/arcjet";
import { signAdminToken } from "@/lib/auth";
import { checkLoginLimit, getBlockedIps, getClientIp } from "@/lib/rateLimit";
import { COOKIE_NAME, COOKIE_OPTIONS, COOKIE_MAX_AGE } from "@/lib/constants";
import { isSameOrigin, isValidEmail } from "@/lib/requestUtils";
import Admin from "@/models/Admin";
import AuditLog from "@/models/AuditLog";

export async function POST(request: Request) {
  try {
    if (!isSameOrigin(request)) {
      return NextResponse.json({ error: "Invalid origin." }, { status: 403 });
    }

    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      return NextResponse.json(
        { error: "Unsupported content type." },
        { status: 415 }
      );
    }

    let arcjetDecision;
    try {
      arcjetDecision = await aj.protect(request);
    } catch (arcjetError) {
      console.error("Arcjet error:", arcjetError);
      arcjetDecision = null;
    }

    if (arcjetDecision?.isDenied()) {
      return NextResponse.json(
        { error: "Login blocked." },
        { status: 403 }
      );
    }

    const ip = getClientIp(request);
    const blocked = getBlockedIps();

    if (blocked.includes(ip)) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const rateKey = `login:${ip}`;
    const rate = await checkLoginLimit(rateKey);

    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Too many login attempts. Try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(rate.retryAfterSeconds) },
        }
      );
    }

    const body = await request.json();
    const email = String(body.email ?? "").toLowerCase().trim();
    // Do NOT trim passwords — whitespace may be intentional
    const password = String(body.password ?? "");

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Invalid email address." },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const admin = await Admin.findOne({ email }).lean<{
      _id?: unknown;
      passwordHash?: string;
      email?: string;
    }>();

    // Always perform password comparison to prevent timing attacks
    const passwordHash = admin?.passwordHash;
    const dummyHash = "$2a$10$invalidhashtopreventtimingattacksdummy";
    const isValid = await bcrypt.compare(
      password,
      typeof passwordHash === "string" ? passwordHash : dummyHash
    );

    if (!admin || typeof passwordHash !== "string" || !isValid) {
      // Log failed attempt
      try {
        await AuditLog.create({
          action: "admin_login_failed",
          adminEmail: email,
          ip,
          meta: { reason: "invalid_credentials" },
        });
      } catch (logError) {
        console.error("Failed to log failed login attempt:", logError);
      }

      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const token = await signAdminToken({
      sub: String(admin._id ?? ""),
      email: admin.email ?? email,
    });

    try {
      await AuditLog.create({
        action: "admin_login",
        adminEmail: admin.email ?? email,
        ip,
      });
    } catch (logErr) {
      console.error("AuditLog write failed (login):", logErr);
    }

    const response = NextResponse.json({
      ok: true,
      message: "Login successful.",
      redirectTo: "/admin"
    });

    // Set secure httpOnly cookie
    response.cookies.set(COOKIE_NAME, token, {
      ...COOKIE_OPTIONS,
      maxAge: COOKIE_MAX_AGE,
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Failed to authenticate." },
      { status: 500 }
    );
  }
}
