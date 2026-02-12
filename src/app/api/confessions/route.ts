import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectToDatabase } from "@/lib/mongodb";
import { aj } from "@/lib/arcjet";
import { isbot } from "isbot";
import { verifyAdminToken } from "@/lib/auth";
import { filterProfanity, sanitizeText } from "@/lib/moderation";
import {
  checkSubmissionLimit,
  getBlockedIps,
  getClientIp,
} from "@/lib/rateLimit";
import Confession from "@/models/Confession";

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("gck_admin_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    try {
      await verifyAdminToken(token);
    } catch {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim() ?? "";
    const status = searchParams.get("status") ?? "";
    const posted = searchParams.get("posted") ?? "";
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? "10")));

    const filter: Record<string, unknown> = {};

    if (query) {
      filter.$or = [
        { message: { $regex: query, $options: "i" } },
        { music: { $regex: query, $options: "i" } },
      ];
    }

    if (status) {
      filter.status = status;
    }

    if (posted === "true" || posted === "false") {
      filter.posted = posted === "true";
    }

    const total = await Confession.countDocuments(filter);
    const data = await Confession.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const confessions = data.map((item) => ({
      _id: String(item._id),
      message: item.message,
      music: item.music,
      status: item.status,
      posted: item.posted,
      createdAt: item.createdAt?.toISOString(),
    }));

    return NextResponse.json({
      confessions,
      page,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load confessions.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    if (process.env.MAINTENANCE_MODE === "on") {
      return NextResponse.json(
        { error: "Submissions are temporarily paused." },
        { status: 503 }
      );
    }

    let arcjetDecision;
    try {
      arcjetDecision = await aj.protect(request);
    } catch (arcjetError) {
      console.error("Arcjet error:", arcjetError);
      // Continue without Arcjet if it fails
      arcjetDecision = null;
    }

    if (arcjetDecision?.isDenied()) {
      return NextResponse.json(
        { error: "Submission blocked." },
        { status: 403 }
      );
    }

    const ip = getClientIp(request);
    const blocked = getBlockedIps();

    if (blocked.includes(ip)) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const userAgent = request.headers.get("user-agent") || "";

    if (isbot(userAgent)) {
      return NextResponse.json(
        { error: "Automated submissions are not allowed." },
        { status: 403 }
      );
    }

    const rate = await checkSubmissionLimit(`submit:${ip}`);

    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Too many submissions. Please try again later." },
        { status: 429 }
      );
    }

    // TODO: Add IP-based rate limiting here (keep anonymity intact).
    const body = await request.json();
    const rawMessage = String(body.message ?? "");
    const rawMusic = String(body.music ?? "");
    const message = sanitizeText(rawMessage, 500);
    const music = sanitizeText(rawMusic, 120);
    const moderated = filterProfanity(message);

    if (!message) {
      return NextResponse.json(
        { error: "Confession message is required." },
        { status: 400 }
      );
    }

    if (message.length < 5) {
      return NextResponse.json(
        { error: "Confession message is too short." },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const confession = await Confession.create({
      message: moderated.clean,
      music,
    });

    return NextResponse.json({ confession }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to submit confession.",
      },
      { status: 500 }
    );
  }
}
