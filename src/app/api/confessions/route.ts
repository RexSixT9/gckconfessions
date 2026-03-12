import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { cookies } from "next/headers";
import { connectToDatabase } from "@/lib/mongodb";
import { aj } from "@/lib/arcjet";
import { writeAuditLog } from "@/lib/audit";
import { isbot } from "isbot";
import { verifyAdminToken } from "@/lib/auth";
import { COOKIE_NAME } from "@/lib/constants";
import { filterProfanity, sanitizeText, validateConfessionSubmission } from "@/lib/moderation";
import { getRequestFingerprint, isSameOrigin } from "@/lib/requestUtils";
import {
  checkSubmissionBurstLimit,
  checkSubmissionLimit,
  getAdaptiveRetryAfterSeconds,
  getBlockedIps,
  getClientIp,
  getRateLimitHeaders,
} from "@/lib/rateLimit";
import { MAX_MESSAGE_LENGTH, MAX_MUSIC_LENGTH } from "@/lib/constants";
import Confession from "@/models/Confession";

type ConfessionResponse = {
  _id: string;
  message: string;
  music: string;
  status: "pending" | "approved" | "rejected";
  posted: boolean;
  createdAt?: string;
  updatedAt?: string;
};

function serializeConfession(item: {
  _id: unknown;
  message?: string;
  music?: string;
  status?: string;
  posted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}): ConfessionResponse {
  return {
    _id: String(item._id),
    message: item.message ?? "",
    music: item.music ?? "",
    status:
      item.status === "approved" || item.status === "rejected"
        ? item.status
        : "pending",
    posted: Boolean(item.posted),
    createdAt: item.createdAt?.toISOString(),
    updatedAt: item.updatedAt?.toISOString(),
  };
}

// NOTE: hCaptcha verification disabled - will be implemented in future
// To enable CAPTCHA protection, uncomment below and add verification logic to POST handler
/*
async function verifyHCaptcha(token: string) {
  const secret = process.env.HCAPTCHA_SECRET_KEY;
  if (!secret) {
    return { success: false };
  }

  const response = await fetch("https://hcaptcha.com/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      secret,
      response: token,
    }).toString(),
  });

  if (!response.ok) {
    return { success: false };
  }

  const data = (await response.json()) as { success?: boolean };
  return { success: Boolean(data.success) };
}
*/

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

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
      filter.$text = { $search: query };
    }

    const validStatuses = ["pending", "approved", "rejected"];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status filter." }, { status: 400 });
    }

    if (status && validStatuses.includes(status)) {
      filter.status = status;
    }

    if (posted === "true" || posted === "false") {
      filter.posted = posted === "true";
    }

    const [total, data] = await Promise.all([
      Confession.countDocuments(filter),
      Confession.find(filter)
        .select({ message: 1, music: 1, status: 1, posted: 1, createdAt: 1, updatedAt: 1 })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean<{
          _id: unknown;
          message?: string;
          music?: string;
          status?: string;
          posted?: boolean;
          createdAt?: Date;
          updatedAt?: Date;
        }[]>(),
    ]);

    const confessions = data.map(serializeConfession);

    return NextResponse.json(
      {
        confessions,
        page,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Confession list error:", error);
    return NextResponse.json(
      { error: "Failed to load confessions." },
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

    const fingerprint = getRequestFingerprint(request, ip);
    const rateKey = `submit:${ip}:${fingerprint}`;
    const rate = await checkSubmissionLimit(rateKey);
    const burst = await checkSubmissionBurstLimit(`submit-burst:${fingerprint}`);

    const risk: "low" | "medium" | "high" =
      ip === "unknown" || isbot(userAgent)
        ? "high"
        : userAgent.length < 18
          ? "medium"
          : "low";
    const adaptiveCooldown = getAdaptiveRetryAfterSeconds(risk);

    if (!rate.allowed || !burst.allowed) {
      const retrySource = !rate.allowed ? rate : burst;
      return NextResponse.json(
        { error: "Too many submissions. Please try again later." },
        {
          status: 429,
          headers: {
            ...getRateLimitHeaders(retrySource),
            "Retry-After": String(
              Math.max(rate.retryAfterSeconds, burst.retryAfterSeconds, adaptiveCooldown)
            ),
          },
        }
      );
    }

    const body = await request.json();
    const rawMessage = String(body.message ?? "");
    const rawMusic = String(body.music ?? "");
    const website = String(body.website ?? "").trim();

    if (website) {
      return NextResponse.json(
        { error: "Submission rejected." },
        { status: 400 }
      );
    }

    const message = sanitizeText(rawMessage, MAX_MESSAGE_LENGTH);
    const music = sanitizeText(rawMusic, MAX_MUSIC_LENGTH);
    const moderated = filterProfanity(message);

    const validation = validateConfessionSubmission(message);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error ?? "Submission rejected." },
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
    })
      .select({ _id: 1 })
      .lean();

    if (recentDuplicate) {
      return NextResponse.json(
        { error: "Duplicate submission detected. Please wait." },
        { status: 429, headers: { "Retry-After": "1800" } }
      );
    }

    const confession = await Confession.create({
      message: moderated.clean,
      messageHash,
      music,
    });

    try {
      await writeAuditLog({
        action: "confession_created",
        request,
        confessionId: String(confession._id),
        meta: {
          moderationChanged: moderated.clean !== message,
          musicIncluded: Boolean(music),
          fingerprint,
        },
      });
    } catch (logError) {
      console.error("AuditLog write failed (confession create):", logError);
    }

    return NextResponse.json({ confession: serializeConfession(confession) }, { status: 201 });
  } catch (error) {
    console.error("Confession submit error:", error);
    return NextResponse.json(
      { error: "Failed to submit confession." },
      { status: 500 }
    );
  }
}
