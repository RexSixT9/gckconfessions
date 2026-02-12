import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";
import { aj } from "@/lib/arcjet";
import { validatePasswordPolicy } from "@/lib/moderation";
import Admin from "@/models/Admin";

export async function POST(request: Request) {
  try {
    let arcjetDecision;
    try {
      arcjetDecision = await aj.protect(request);
    } catch (arcjetError) {
      console.error("Arcjet error:", arcjetError);
      arcjetDecision = null;
    }

    if (arcjetDecision?.isDenied()) {
      return NextResponse.json(
        { error: "Setup blocked." },
        { status: 403 }
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
    const password = String(body.password ?? "").trim();
    const providedKey = String(body.setupKey ?? "").trim();

    if (!email || !password || !providedKey) {
      return NextResponse.json(
        { error: "Email, password, and setupKey are required." },
        { status: 400 }
      );
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

    if (providedKey !== setupKey) {
      return NextResponse.json({ error: "Invalid setup key." }, { status: 401 });
    }

    await connectToDatabase();
    const existingCount = await Admin.countDocuments();

    if (existingCount > 0) {
      return NextResponse.json(
        { error: "Admin already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await Admin.create({ email, passwordHash });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create admin.",
      },
      { status: 500 }
    );
  }
}
