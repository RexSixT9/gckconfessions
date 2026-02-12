import { NextResponse } from "next/server";
import { createHash } from "crypto";
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

function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;

  const host = request.headers.get("host");
  if (!host) return false;

  try {
    const originHost = new URL(origin).host;
    return originHost === host;
  } catch {
    return false;
  }
}

async function verifyTurnstile(token: string, ip: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    return { success: false };
  }

  const response = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret,
        response: token,
        remoteip: ip,
      }).toString(),
    }
  );

  if (!response.ok) {
    return { success: false };
  }

  const data = (await response.json()) as { success?: boolean };
  return { success: Boolean(data.success) };
}

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
    if (!isSameOrigin(request)) {
      return NextResponse.json(
        { error: "Invalid origin.", code: "ORIGIN_DENY" },
        { status: 403 }
      );
    }

    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      return NextResponse.json(
        { error: "Unsupported content type." },
        { status: 415 }
      );
    }

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
        { error: "Submission blocked.", code: "ARCJET_DENY" },
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
        { error: "Automated submissions are not allowed.", code: "BOT_DENY" },
        { status: 403 }
      );
    }

    const rateKey = `submit:${ip}:${userAgent.slice(0, 32)}`;
    const rate = await checkSubmissionLimit(rateKey);

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
    const website = String(body.website ?? "").trim();
    const turnstileToken = String(body.turnstileToken ?? "").trim();

    if (website) {
      return NextResponse.json(
        { error: "Submission rejected." },
        { status: 400 }
      );
    }

    if (!turnstileToken) {
      return NextResponse.json(
        { error: "Verification required.", code: "TURNSTILE_REQUIRED" },
        { status: 400 }
      );
    }

    const turnstile = await verifyTurnstile(turnstileToken, ip);
    if (!turnstile.success) {
      return NextResponse.json(
        { error: "Verification failed.", code: "TURNSTILE_FAIL" },
        { status: 403 }
      );
    }

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
    const messageHash = createHash("sha256")
      .update(message.toLowerCase())
      .digest("hex");
    const duplicateWindowMs = 30 * 60 * 1000;
    const recentDuplicate = await Confession.findOne({
      messageHash,
      createdAt: { $gte: new Date(Date.now() - duplicateWindowMs) },
    }).lean();

    if (recentDuplicate) {
      return NextResponse.json(
        { error: "Duplicate submission detected. Please wait." },
        { status: 429 }
      );
    }

    const confession = await Confession.create({
      message: moderated.clean,
      messageHash,
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
