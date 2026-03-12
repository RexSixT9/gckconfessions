import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { connectToDatabase } from "@/lib/mongodb";
import { aj } from "@/lib/arcjet";
import { writeAuditLog } from "@/lib/audit";
import { verifyAdminToken } from "@/lib/auth";
import { validatePasswordPolicy } from "@/lib/moderation";
import { COOKIE_NAME, BCRYPT_ROUNDS, MAX_EMAIL_LENGTH } from "@/lib/constants";
import { checkSetupLimit, getBlockedIps, getClientIp, getRateLimitHeaders } from "@/lib/rateLimit";
import { isSameOrigin, isValidEmail, safeCompare } from "@/lib/requestUtils";
import Admin from "@/models/Admin";

/**
 * GET /api/admin/admins
 * List all admin accounts (id + email + createdAt). Password hashes are never returned.
 */
export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized.", code: "UNAUTHORIZED" }, { status: 401 });

    const caller = await verifyAdminToken(token);
    if (!caller.sub) return NextResponse.json({ error: "Unauthorized.", code: "UNAUTHORIZED" }, { status: 401 });

    await connectToDatabase();
    const admins = await Admin.find()
      .select({ _id: 1, email: 1, createdAt: 1 })
      .sort({ createdAt: 1 })
      .lean();

    return NextResponse.json({
      admins: admins.map((a) => ({
        _id: String(a._id),
        email: a.email,
        createdAt: (a as { createdAt?: Date }).createdAt?.toISOString() ?? null,
        isSelf: String(a._id) === caller.sub,
      })),
    });
  } catch (error) {
    console.error("Admin list error:", error);
    return NextResponse.json(
      { error: "Failed to list admins.", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/admins
 * Create a new admin account. Authenticated via ADMIN_SETUP_KEY.
 *
 * Body: { email: string; password: string; setupKey: string }
 */
export async function POST(request: Request) {
  try {
    if (!isSameOrigin(request)) {
      return NextResponse.json({ error: "Invalid origin.", code: "INVALID_ORIGIN" }, { status: 403 });
    }

    let arcjetDecision;
    try {
      arcjetDecision = await aj.protect(request);
    } catch (arcjetError) {
      console.error("Arcjet error:", arcjetError);
      arcjetDecision = null;
    }

    if (arcjetDecision?.isDenied()) {
      return NextResponse.json({ error: "Request blocked.", code: "ARCJET_DENY" }, { status: 403 });
    }

    const ip = getClientIp(request);

    if (getBlockedIps().includes(ip)) {
      return NextResponse.json({ error: "Unauthorized.", code: "BLOCKED_IP" }, { status: 401 });
    }

    const rate = await checkSetupLimit(`admin-create:${ip}`);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Try again later.", code: "RATE_LIMIT" },
        { status: 429, headers: getRateLimitHeaders(rate) }
      );
    }

    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      return NextResponse.json({ error: "Unsupported content type.", code: "UNSUPPORTED_CONTENT_TYPE" }, { status: 415 });
    }

    const setupKey = process.env.ADMIN_SETUP_KEY;
    if (!setupKey) {
      return NextResponse.json(
        { error: "ADMIN_SETUP_KEY is not configured.", code: "SETUP_KEY_MISSING" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const email = String(body.email ?? "").toLowerCase().trim();
    // Do NOT trim passwords — whitespace may be intentional
    const password = String(body.password ?? "");
    const providedKey = String(body.setupKey ?? "").trim();

    if (!email || !password || !providedKey) {
      return NextResponse.json(
        { error: "Email, password, and setupKey are required.", code: "MISSING_FIELDS" },
        { status: 400 }
      );
    }

    if (!safeCompare(providedKey, setupKey)) {
      return NextResponse.json({ error: "Invalid setup key.", code: "INVALID_SETUP_KEY" }, { status: 401 });
    }

    if (email.length > MAX_EMAIL_LENGTH || !isValidEmail(email)) {
      return NextResponse.json({ error: "Invalid email address.", code: "INVALID_EMAIL" }, { status: 400 });
    }

    if (!validatePasswordPolicy(password)) {
      return NextResponse.json(
        {
          error:
            "Password must be at least 12 characters and include uppercase, lowercase, number, and symbol.",
          code: "WEAK_PASSWORD"
        },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const existing = await Admin.findOne({ email }).select({ _id: 1 }).lean();
    if (existing) {
      return NextResponse.json(
        { error: "An admin with that email already exists.", code: "EMAIL_EXISTS" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const newAdmin = await Admin.create({ email, passwordHash });

    await writeAuditLog({
      action: "admin_created",
      request,
      adminEmail: email,
      meta: { createdEmail: email },
    });

    return NextResponse.json(
      {
        admin: {
          _id: String(newAdmin._id),
          email: newAdmin.email,
          createdAt: (newAdmin as { createdAt?: Date }).createdAt?.toISOString() ?? null,
        },
        ok: true
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Admin create error:", error);
    return NextResponse.json(
      { error: "Failed to create admin.", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
