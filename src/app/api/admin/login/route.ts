import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";
import { aj } from "@/lib/arcjet";
import { signAdminToken } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { checkLoginIdentityLimit, checkLoginLimit, getBlockedIps, getClientIp, getRateLimitHeaders } from "@/lib/rateLimit";
import { COOKIE_NAME, COOKIE_OPTIONS, COOKIE_MAX_AGE, MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH } from "@/lib/constants";
import { isSameOrigin, isValidEmail } from "@/lib/requestUtils";
import Admin from "@/models/Admin";
const DUMMY_PASSWORD_HASH = "$2a$10$CwTycUXWue0Thq9StjUM0uJ8n9f5M5w7x1YgnSUQoqBYwygJyI072";

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

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
    }

    const payload = body as Record<string, unknown>;
    const email =
      typeof payload.email === "string"
        ? payload.email.toLowerCase().trim()
        : "";
    // Do NOT trim passwords — whitespace may be intentional
    const password = typeof payload.password === "string" ? payload.password : "";

    const rateKey = `login:${ip}`;
    const identityKey = `login-account:${email || "unknown"}`;
    const [rate, identityRate] = await Promise.all([
      checkLoginLimit(rateKey),
      checkLoginIdentityLimit(identityKey),
    ]);

    if (!rate.allowed || !identityRate.allowed) {
      const retrySource = rate.allowed ? identityRate : rate;
      return NextResponse.json(
        { error: "Too many login attempts. Try again later." },
        {
          status: 429,
          headers: getRateLimitHeaders(retrySource),
        }
      );
    }

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

    if (password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `Password must be ${MIN_PASSWORD_LENGTH}-${MAX_PASSWORD_LENGTH} characters.` },
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
    const hashToCompare = typeof passwordHash === "string" ? passwordHash : DUMMY_PASSWORD_HASH;
    let isValid = false;
    try {
      isValid = await bcrypt.compare(password, hashToCompare);
    } catch {
      isValid = false;
    }

    if (!admin || typeof passwordHash !== "string" || !isValid) {
      try {
        await writeAuditLog({
          action: "admin_login_failed",
          request,
          adminEmail: email,
          meta: { reason: "invalid_credentials", loginKey: identityKey },
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
      await writeAuditLog({
        action: "admin_login",
        request,
        adminEmail: admin.email ?? email,
      });
    } catch (logErr) {
      console.error("AuditLog write failed (login):", logErr);
    }

    const response = NextResponse.json({
      ok: true,
      message: "Login successful.",
      redirectTo: "/admin"
    }, {
      headers: { "Cache-Control": "no-store" },
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
