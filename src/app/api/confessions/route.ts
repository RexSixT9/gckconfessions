import { createHash } from "crypto";
import { cookies } from "next/headers";
import { connectToDatabase } from "@/lib/mongodb";
import { aj } from "@/lib/arcjet";
import { apiError, apiOk, isJsonContentType, parseJsonObject, safeLogError } from "@/lib/api";
import { ensureCsrfCookie } from "@/lib/csrf";
import { writeAuditLog } from "@/lib/audit";
import { isbot } from "isbot";
import { verifyAdminToken } from "@/lib/auth";
import { COOKIE_NAME } from "@/lib/constants";
import { filterProfanity, sanitizeOutputText, sanitizeText, validateConfessionSubmission } from "@/lib/moderation";
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
    message: sanitizeOutputText(item.message ?? "", MAX_MESSAGE_LENGTH),
    music: sanitizeOutputText(item.music ?? "", MAX_MUSIC_LENGTH),
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
      return apiError(401, "UNAUTHORIZED", "Unauthorized.");
    }

    try {
      await verifyAdminToken(token);
    } catch {
      return apiError(401, "UNAUTHORIZED", "Unauthorized.");
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
      return apiError(400, "VALIDATION_ERROR", "Invalid status filter.");
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

    const response = apiOk(
      {
        confessions,
        page,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
      200,
      {
        "Cache-Control": "no-store",
      }
    );
    await ensureCsrfCookie(response);
    return response;
  } catch (error) {
    safeLogError("Confession list error", error);
    return apiError(500, "SERVER_ERROR", "Failed to load confessions.");
  }
}

export async function POST(request: Request) {
  try {
    if (!isSameOrigin(request)) {
      return apiError(403, "INVALID_ORIGIN", "Invalid origin.");
    }

    if (!isJsonContentType(request)) {
      return apiError(415, "INVALID_CONTENT_TYPE", "Unsupported content type.");
    }

    if (process.env.MAINTENANCE_MODE === "on") {
      return apiError(503, "SERVICE_UNAVAILABLE", "Submissions are temporarily paused.");
    }

    let arcjetDecision;
    try {
      arcjetDecision = await aj.protect(request);
    } catch (arcjetError) {
      safeLogError("Arcjet error", arcjetError);
      // Continue without Arcjet if it fails
      arcjetDecision = null;
    }

    if (arcjetDecision?.isDenied()) {
      return apiError(403, "FORBIDDEN", "Submission blocked.");
    }

    const ip = getClientIp(request);
    const blocked = getBlockedIps();

    if (blocked.includes(ip)) {
      return apiError(401, "UNAUTHORIZED", "Unauthorized.");
    }

    const userAgent = request.headers.get("user-agent") || "";

    if (isbot(userAgent)) {
      return apiError(403, "FORBIDDEN", "Automated submissions are not allowed.");
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

    const humanCheckHeader = request.headers.get("x-human-check") ?? "";
    if (risk === "high" && humanCheckHeader !== "1") {
      return apiError(403, "CHALLENGE_REQUIRED", "Additional verification required.");
    }

    const adaptiveCooldown = getAdaptiveRetryAfterSeconds(risk);

    if (!rate.allowed || !burst.allowed) {
      const retrySource = !rate.allowed ? rate : burst;
      return apiError(429, "RATE_LIMIT", "Too many submissions. Please try again later.", {
        ...getRateLimitHeaders(retrySource),
        "Retry-After": String(
          Math.max(rate.retryAfterSeconds, burst.retryAfterSeconds, adaptiveCooldown)
        ),
      });
    }

    const body = await parseJsonObject(request);
    if (!body) {
      return apiError(400, "INVALID_JSON", "Invalid request payload.");
    }

    const rawMessage = String(body.message ?? "");
    const rawMusic = String(body.music ?? "");
    const website = String(body.website ?? "").trim();

    if (website) {
      return apiError(400, "VALIDATION_ERROR", "Submission rejected.");
    }

    const message = sanitizeText(rawMessage, MAX_MESSAGE_LENGTH);
    const music = sanitizeText(rawMusic, MAX_MUSIC_LENGTH);
    const moderated = filterProfanity(message);

    const validation = validateConfessionSubmission(message);
    if (!validation.valid) {
      return apiError(400, "VALIDATION_ERROR", validation.error ?? "Submission rejected.");
    }

    if (message.length < 5) {
      return apiError(400, "VALIDATION_ERROR", "Confession message is too short.");
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
      return apiError(429, "RATE_LIMIT", "Duplicate submission detected. Please wait.", {
        "Retry-After": "1800",
      });
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
      safeLogError("AuditLog write failed (confession create)", logError);
    }

    return apiOk({ confession: serializeConfession(confession) }, 201);
  } catch (error) {
    safeLogError("Confession submit error", error);
    return apiError(500, "SERVER_ERROR", "Failed to submit confession.");
  }
}
