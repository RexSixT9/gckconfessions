import { createHash } from "crypto";
import { connectToDatabase } from "@/lib/mongodb";
import { aj } from "@/lib/arcjet";
import { apiError, apiOk, isJsonContentType, parseJsonObject, safeLogError } from "@/lib/api";
import { writeAuditLog } from "@/lib/audit";
import { isbot } from "isbot";
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
