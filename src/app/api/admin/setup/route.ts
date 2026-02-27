import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";
import { aj } from "@/lib/arcjet";
import { validatePasswordPolicy } from "@/lib/moderation";
import { BCRYPT_ROUNDS } from "@/lib/constants";
import { checkSetupLimit, getBlockedIps, getClientIp } from "@/lib/rateLimit";
import { isSameOrigin, isValidEmail, safeCompare } from "@/lib/requestUtils";
import Admin from "@/models/Admin";

export async function POST(request: Request) {
  try {
    if (!isSameOrigin(request)) {
      return NextResponse.json({ error: "Invalid origin." }, { status: 403 });
    }

    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      return NextResponse.json({ error: "Unsupported content type." }, { status: 415 });
    }

    let arcjetDecision;
    try {
      arcjetDecision = await aj.protect(request);
    } catch (arcjetError) {
      console.error("Arcjet error:", arcjetError);
      arcjetDecision = null;
    }

    if (arcjetDecision?.isDenied()) {
      return NextResponse.json({ error: "Setup blocked." }, { status: 403 });
    }

    const ip = getClientIp(request);

    if (getBlockedIps().includes(ip)) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const rate = await checkSetupLimit(`setup:${ip}`);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Too many setup attempts. Try again later." },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
      );
    }

    const setupKey = process.env.ADMIN_SETUP_KEY;
    if (!setupKey) {
      return NextResponse.json(
        { error: "ADMIN_SETUP_KEY is not configured." },
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
        { error: "Email, password, and setupKey are required." },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }

    if (!validatePasswordPolicy(password)) {
      return NextResponse.json(
        {
          error:
            "Password must be at least 12 characters and include uppercase, lowercase, number, and symbol.",
        },
        { status: 400 }
      );
    }

    if (!safeCompare(providedKey, setupKey)) {
      return NextResponse.json({ error: "Invalid setup key." }, { status: 401 });
    }

    await connectToDatabase();

    const existing = await Admin.findOne({ email }).select({ _id: 1 }).lean();
    if (existing) {
      return NextResponse.json(
        { error: "An admin with that email already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    await Admin.create({ email, passwordHash });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("Admin setup error:", error);
    return NextResponse.json(
      { error: "Failed to create admin." },
      { status: 500 }
    );
  }
}
