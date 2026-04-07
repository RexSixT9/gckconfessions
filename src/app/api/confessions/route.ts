import { createHash } from "crypto";
import { cookies } from "next/headers";
import { connectToDatabase } from "@/lib/mongodb";
import { apiAuthError, apiError, apiOk, parseJsonObject, safeLogError } from "@/lib/api";
import { ensureCsrfCookie } from "@/lib/csrf";
import { writeAuditLog } from "@/lib/audit";
import { isbot } from "isbot";
import { verifyAdminTokenSafe } from "@/lib/auth";
import { COOKIE_NAME } from "@/lib/constants";
import {
  filterProfanity,
  getTextSimilarityScore,
  normalizeForSimilarity,
  sanitizeOutputText,
  sanitizeText,
  SANITIZATION_POLICY_VERSION,
  validateConfessionSubmission,
} from "@/lib/moderation";
import { getClientContext, getRequestFingerprint } from "@/lib/requestUtils";
import {
  checkAdminReadLimit,
  checkSubmissionBurstLimit,
  checkSubmissionLimit,
  getAdaptiveRetryAfterSeconds,
  getClientIp,
  getRateLimitHeaders,
} from "@/lib/rateLimit";
import { MAX_MESSAGE_LENGTH, MAX_MUSIC_LENGTH } from "@/lib/constants";
import { confessionSubmitSchema } from "@/lib/validation";
import { runMutatingRouteGuard } from "@/lib/routeGuards";
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

function parseBoundedInt(
  value: string | null,
  fallback: number,
  min: number,
  max: number
): { ok: true; value: number } | { ok: false } {
  if (!value || value.trim() === "") {
    return { ok: true, value: fallback };
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed)) {
    return { ok: false };
  }

  return { ok: true, value: Math.max(min, Math.min(max, parsed)) };
}

function matchesIfNoneMatch(headerValue: string | null, etag: string) {
  if (!headerValue) return false;
  const candidates = headerValue.split(",").map((value) => value.trim());
  return candidates.includes("*") || candidates.includes(etag);
}

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

    const auth = await verifyAdminTokenSafe(token);
    if (!auth.ok) {
      return apiAuthError(auth.reason);
    }

    const readRate = await checkAdminReadLimit(`confession-list:${getClientIp(request)}`);
    if (!readRate.allowed) {
      return apiError(429, "RATE_LIMIT", "Too many requests. Try again later.", getRateLimitHeaders(readRate));
    }

    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim() ?? "";
    const status = searchParams.get("status") ?? "";
    const posted = searchParams.get("posted") ?? "";
    const pageParam = parseBoundedInt(searchParams.get("page"), 1, 1, 10_000);
    if (!pageParam.ok) {
      return apiError(400, "VALIDATION_ERROR", "Invalid page query parameter.");
    }

    const limitParam = parseBoundedInt(searchParams.get("limit"), 10, 1, 50);
    if (!limitParam.ok) {
      return apiError(400, "VALIDATION_ERROR", "Invalid limit query parameter.");
    }

    const page = pageParam.value;
    const limit = limitParam.value;

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

    const etagSource = {
      query: query.toLowerCase(),
      status: status || "all",
      posted: posted || "all",
      page,
      limit,
      total,
      firstId: confessions[0]?._id ?? "",
      firstUpdatedAt: confessions[0]?.updatedAt ?? "",
      firstStatus: confessions[0]?.status ?? "",
      firstPosted: confessions[0]?.posted ?? false,
    };
    const etag = `"${createHash("sha256").update(JSON.stringify(etagSource)).digest("base64url")}"`;

    if (matchesIfNoneMatch(request.headers.get("if-none-match"), etag)) {
      return new Response(null, {
        status: 304,
        headers: {
          "Cache-Control": "private, no-store, max-age=0",
          ETag: etag,
          Vary: "Cookie, If-None-Match",
        },
      });
    }

    const response = apiOk(
      {
        confessions,
        page,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
      200,
      {
        "Cache-Control": "private, no-store, max-age=0",
        ETag: etag,
        Vary: "Cookie, If-None-Match",
      }
    );

    // Intentionally disabled for now to reduce high-volume "viewed" audit noise.

    await ensureCsrfCookie(response);
    return response;
  } catch (error) {
    safeLogError("Confession list error", error);
    return apiError(500, "SERVER_ERROR", "Failed to load confessions.");
  }
}

export async function POST(request: Request) {
  try {
    if (process.env.MAINTENANCE_MODE === "on") {
      return apiError(503, "SERVICE_UNAVAILABLE", "Submissions are temporarily paused.");
    }

    const guard = await runMutatingRouteGuard(request, {
      requireJson: true,
      useArcjet: true,
      arcjetBlockedMessage: "Submission blocked.",
      checkBlockedIp: true,
    });
    if (!guard.ok) {
      return guard.response;
    }

    const ip = guard.ctx.ip;

    const userAgent = request.headers.get("user-agent") || "";

    if (isbot(userAgent)) {
      return apiError(403, "FORBIDDEN", "Automated submissions are not allowed.");
    }

    const fingerprint = getRequestFingerprint(request, ip);
    const clientContext = getClientContext(request, ip);
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

    const parsed = confessionSubmitSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(400, "VALIDATION_ERROR", "Invalid submission payload.");
    }

    const rawMessage = parsed.data.message;
    const rawMusic = parsed.data.music;
    const website = parsed.data.website.trim();

    if (website) {
      return apiError(400, "VALIDATION_ERROR", "Submission rejected.");
    }

    const message = sanitizeText(rawMessage, MAX_MESSAGE_LENGTH);
    const music = sanitizeText(rawMusic, MAX_MUSIC_LENGTH);
    const moderated = filterProfanity(message);
    const normalizedMessage = normalizeForSimilarity(moderated.clean, MAX_MESSAGE_LENGTH);

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
    const messageNormalizedHash = createHash("sha256")
      .update(normalizedMessage)
      .digest("hex");
    const duplicateWindowMs = 30 * 60 * 1000;
    const duplicateSince = new Date(Date.now() - duplicateWindowMs);
    const [recentDuplicate, recentNormalizedDuplicate, recentCandidates] = await Promise.all([
      Confession.findOne({
        messageHash,
        createdAt: { $gte: duplicateSince },
      })
        .select({ _id: 1 })
        .lean(),
      Confession.findOne({
        messageNormalizedHash,
        createdAt: { $gte: duplicateSince },
      })
        .select({ _id: 1 })
        .lean(),
      Confession.find({
        createdAt: { $gte: duplicateSince },
      })
        .sort({ createdAt: -1 })
        .limit(60)
        .select({ _id: 1, message: 1 })
        .lean<Array<{ _id: unknown; message?: string }>>(),
    ]);

    if (recentDuplicate || recentNormalizedDuplicate) {
      return apiError(429, "RATE_LIMIT", "Duplicate submission detected. Please wait.", {
        "Retry-After": "1800",
      });
    }

    const mostSimilar = recentCandidates
      .map((item) => ({
        id: String(item._id),
        score: getTextSimilarityScore(normalizedMessage, item.message ?? ""),
      }))
      .sort((a, b) => b.score - a.score)[0];

    if (mostSimilar && mostSimilar.score >= 0.9) {
      return apiError(429, "RATE_LIMIT", "Very similar submission detected. Please wait before posting again.", {
        "Retry-After": "1800",
      });
    }

    const confession = await Confession.create({
      message: moderated.clean,
      messageHash,
      messageNormalizedHash,
      sanitizationVersion: SANITIZATION_POLICY_VERSION,
      music,
      submitterIpHash: clientContext.ipHash,
      submitterFingerprint: fingerprint,
      submitterUserAgent: clientContext.userAgent,
      submitterDeviceType: clientContext.deviceType,
      submitterBrowser: clientContext.browser,
      submitterOs: clientContext.os,
      submitterModel: clientContext.model,
      submitterPlatform: clientContext.platform,
      submitterManufacturer: clientContext.manufacturer,
      submitterManufacturerConfidence: clientContext.manufacturerConfidence,
      submitterSecChUa: clientContext.secChUa,
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
          ipHash: clientContext.ipHash,
          deviceType: clientContext.deviceType,
          browser: clientContext.browser,
          os: clientContext.os,
          model: clientContext.model,
          platform: clientContext.platform,
          manufacturer: clientContext.manufacturer,
          manufacturerConfidence: clientContext.manufacturerConfidence,
          sanitizationVersion: SANITIZATION_POLICY_VERSION,
          similarityScore: mostSimilar?.score ?? 0,
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
