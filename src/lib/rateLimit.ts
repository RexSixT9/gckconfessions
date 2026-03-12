import { RateLimiterMemory } from "rate-limiter-flexible";
import { MAX_LOGIN_ATTEMPTS } from "./constants";

// NOTE: RateLimiterMemory is per-process. In a serverless environment (e.g. Vercel)
// each function instance has its own state. For shared cross-instance rate limiting,
// replace with RateLimiterRedis / RateLimiterMongo pointing to your DB.

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  /** Unix ms timestamp when the window resets */
  reset: number;
  /** Seconds until reset, useful for Retry-After header */
  retryAfterSeconds: number;
};

// ─── IP helpers ──────────────────────────────────────────────────────────────

export function getClientIp(request: Request): string {
  if (process.env.NODE_ENV !== "production" && process.env.DEV_IP_OVERRIDE) {
    return process.env.DEV_IP_OVERRIDE;
  }

  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  if (cfConnectingIp) return cfConnectingIp;

  const vercelForwarded = request.headers.get("x-vercel-forwarded-for");
  if (vercelForwarded) return vercelForwarded.split(",")[0]?.trim() || "unknown";

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";

  return request.headers.get("x-real-ip") || "unknown";
}

export function getBlockedIps(): string[] {
  const list = process.env.BLOCKED_IPS ?? "";
  return list
    .split(",")
    .map((ip) => ip.trim())
    .filter(Boolean);
}

// ─── Limiters ────────────────────────────────────────────────────────────────

/** Public confession submissions: 3/5 min in prod */
const submissionLimiter = new RateLimiterMemory({
  points: process.env.NODE_ENV === "production" ? 3 : 10,
  duration: process.env.NODE_ENV === "production" ? 5 * 60 : 15 * 60,
  blockDuration: process.env.NODE_ENV === "production" ? 15 * 60 : 0,
});

/**
 * Burst limiter catches rapid-fire spikes (e.g. scripted flooding).
 */
const burstSubmissionLimiter = new RateLimiterMemory({
  points: process.env.NODE_ENV === "production" ? 4 : 20,
  duration: 60,
  blockDuration: process.env.NODE_ENV === "production" ? 10 * 60 : 0,
});

/**
 * Admin login: uses MAX_LOGIN_ATTEMPTS constant.
 * 5 attempts per 15 min in prod; blocks for 15 min on exhaustion.
 */
const loginLimiter = new RateLimiterMemory({
  points: MAX_LOGIN_ATTEMPTS,
  duration: process.env.NODE_ENV === "production" ? 15 * 60 : 60 * 60,
  blockDuration: process.env.NODE_ENV === "production" ? 15 * 60 : 0,
});

/**
 * One-time setup endpoint: very strict (3 attempts / 30 min in prod).
 */
const setupLimiter = new RateLimiterMemory({
  points: process.env.NODE_ENV === "production" ? 3 : 10,
  duration: process.env.NODE_ENV === "production" ? 30 * 60 : 60 * 60,
  blockDuration: process.env.NODE_ENV === "production" ? 60 * 60 : 0,
});

/**
 * Admin management actions (create / delete admins): 10 / 10 min.
 */
const adminActionLimiter = new RateLimiterMemory({
  points: process.env.NODE_ENV === "production" ? 10 : 50,
  duration: 10 * 60,
  blockDuration: process.env.NODE_ENV === "production" ? 5 * 60 : 0,
});

// ─── Consume helper ───────────────────────────────────────────────────────────

async function consume(limiter: RateLimiterMemory, key: string): Promise<RateLimitResult> {
  try {
    const res = await limiter.consume(key);
    const msBeforeNext = res.msBeforeNext ?? 0;
    return {
      allowed: true,
      remaining: res.remainingPoints,
      reset: Date.now() + msBeforeNext,
      retryAfterSeconds: Math.ceil(msBeforeNext / 1000),
    };
  } catch (rej: unknown) {
    const msBeforeNext =
      typeof rej === "object" &&
      rej !== null &&
      "msBeforeNext" in rej &&
      typeof (rej as { msBeforeNext?: number }).msBeforeNext === "number"
        ? (rej as { msBeforeNext: number }).msBeforeNext
        : 0;
    return {
      allowed: false,
      remaining: 0,
      reset: Date.now() + msBeforeNext,
      retryAfterSeconds: Math.max(1, Math.ceil(msBeforeNext / 1000)),
    };
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function checkSubmissionLimit(key: string) {
  return consume(submissionLimiter, key);
}

export function checkSubmissionBurstLimit(key: string) {
  return consume(burstSubmissionLimiter, key);
}

/**
 * Adaptive cooldown policy by risk score.
 */
export function getAdaptiveRetryAfterSeconds(risk: "low" | "medium" | "high") {
  if (risk === "high") return 15 * 60;
  if (risk === "medium") return 5 * 60;
  return 60;
}

export function checkLoginLimit(key: string) {
  return consume(loginLimiter, key);
}

export function checkSetupLimit(key: string) {
  return consume(setupLimiter, key);
}

export function checkAdminActionLimit(key: string) {
  return consume(adminActionLimiter, key);
}
