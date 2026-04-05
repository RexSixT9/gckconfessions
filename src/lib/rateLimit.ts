import { RateLimiterMemory, RateLimiterRedis } from "rate-limiter-flexible";
import { MAX_LOGIN_ATTEMPTS } from "./constants";
import { getRedisClient } from "./redis";
import { safeLogError } from "./api";

// Uses shared Redis-backed limiters when REDIS_URL is available.
// Falls back to in-memory limiters locally or when Redis is not configured.

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  /** Unix ms timestamp when the window resets */
  reset: number;
  /** Seconds until reset, useful for Retry-After header */
  retryAfterSeconds: number;
};

export type RateLimitHeaders = Record<string, string>;

type LimiterLike = {
  consume: (key: string) => Promise<{ remainingPoints: number; msBeforeNext?: number }>;
};

type LimiterOptions = {
  points: number;
  duration: number;
  blockDuration?: number;
};

const RATE_LIMIT_PREFIX = `gck:${process.env.NODE_ENV === "production" ? "prod" : "dev"}`;

function createLimiter(scope: string, options: LimiterOptions): LimiterLike {
  const redis = getRedisClient();
  const keyPrefix = `${RATE_LIMIT_PREFIX}:${scope}`;

  if (redis) {
    return new RateLimiterRedis({
      storeClient: redis,
      keyPrefix,
      ...options,
    });
  }

  return new RateLimiterMemory({
    keyPrefix,
    ...options,
  });
}

// ─── IP helpers ──────────────────────────────────────────────────────────────

export function getClientIp(request: Request): string {
  if (process.env.NODE_ENV !== "production" && process.env.DEV_IP_OVERRIDE) {
    return process.env.DEV_IP_OVERRIDE;
  }

  const normalizeIp = (value: string | null) => {
    if (!value) return "unknown";
    const candidate = value.split(",")[0]?.trim() ?? "unknown";
    return candidate.slice(0, 64) || "unknown";
  };

  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  if (cfConnectingIp) return normalizeIp(cfConnectingIp);

  const vercelForwarded = request.headers.get("x-vercel-forwarded-for");
  if (vercelForwarded) return normalizeIp(vercelForwarded);

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return normalizeIp(forwarded);

  return normalizeIp(request.headers.get("x-real-ip"));
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
const submissionLimiter = createLimiter("submit", {
  points: process.env.NODE_ENV === "production" ? 3 : 10,
  duration: process.env.NODE_ENV === "production" ? 5 * 60 : 15 * 60,
  blockDuration: process.env.NODE_ENV === "production" ? 15 * 60 : 0,
});

/**
 * Burst limiter catches rapid-fire spikes (e.g. scripted flooding).
 */
const burstSubmissionLimiter = createLimiter("submit-burst", {
  points: process.env.NODE_ENV === "production" ? 4 : 20,
  duration: 60,
  blockDuration: process.env.NODE_ENV === "production" ? 10 * 60 : 0,
});

/**
 * Admin login: uses MAX_LOGIN_ATTEMPTS constant.
 * 5 attempts per 15 min in prod; blocks for 15 min on exhaustion.
 */
const loginLimiter = createLimiter("login", {
  points: MAX_LOGIN_ATTEMPTS,
  duration: process.env.NODE_ENV === "production" ? 15 * 60 : 60 * 60,
  blockDuration: process.env.NODE_ENV === "production" ? 15 * 60 : 0,
});

/**
 * Fingerprint burst limiter for admin login endpoint.
 */
const loginBurstLimiter = createLimiter("login-burst", {
  points: process.env.NODE_ENV === "production" ? 10 : 80,
  duration: 60,
  blockDuration: process.env.NODE_ENV === "production" ? 15 * 60 : 0,
});

/**
 * Email-scoped login limiter slows credential stuffing against a single admin account.
 */
const loginIdentityLimiter = createLimiter("login-identity", {
  points: process.env.NODE_ENV === "production" ? 6 : 30,
  duration: process.env.NODE_ENV === "production" ? 15 * 60 : 60 * 60,
  blockDuration: process.env.NODE_ENV === "production" ? 20 * 60 : 0,
});

/**
 * One-time setup endpoint: very strict (3 attempts / 30 min in prod).
 */
const setupLimiter = createLimiter("setup", {
  points: process.env.NODE_ENV === "production" ? 3 : 10,
  duration: process.env.NODE_ENV === "production" ? 30 * 60 : 60 * 60,
  blockDuration: process.env.NODE_ENV === "production" ? 60 * 60 : 0,
});

/**
 * Admin management actions (create / delete admins): 10 / 10 min.
 */
const adminActionLimiter = createLimiter("admin-action", {
  points: process.env.NODE_ENV === "production" ? 10 : 50,
  duration: 10 * 60,
  blockDuration: process.env.NODE_ENV === "production" ? 5 * 60 : 0,
});

/**
 * Admin read APIs (dashboards/list polling): 180 / minute in prod.
 */
const adminReadLimiter = createLimiter("admin-read", {
  points: process.env.NODE_ENV === "production" ? 180 : 1500,
  duration: 60,
  blockDuration: process.env.NODE_ENV === "production" ? 60 : 0,
});

/**
 * CSP report endpoint limiter to reduce alert/audit flooding.
 */
const cspReportLimiter = createLimiter("csp-report", {
  points: process.env.NODE_ENV === "production" ? 30 : 300,
  duration: 60,
  blockDuration: process.env.NODE_ENV === "production" ? 2 * 60 : 0,
});

type LoginFailureState = {
  count: number;
  lockedUntil: number;
  lastAttemptAt: number;
};

const loginFailures = new Map<string, LoginFailureState>();
const LOGIN_BACKOFF_BASE_SECONDS = 30;
const LOGIN_BACKOFF_MAX_SECONDS = 20 * 60;
const LOGIN_FAILURE_RESET_MS = 60 * 60 * 1000;

export function getLoginBackoff(identity: string) {
  const state = loginFailures.get(identity);
  if (!state) return 0;
  if (Date.now() > state.lockedUntil) return 0;
  return Math.max(1, Math.ceil((state.lockedUntil - Date.now()) / 1000));
}

export function registerLoginFailure(identity: string) {
  const now = Date.now();
  const current = loginFailures.get(identity);

  const baseCount = current && now - current.lastAttemptAt < LOGIN_FAILURE_RESET_MS ? current.count : 0;
  const count = baseCount + 1;
  const backoffSeconds = Math.min(LOGIN_BACKOFF_MAX_SECONDS, LOGIN_BACKOFF_BASE_SECONDS * 2 ** Math.max(0, count - 3));

  loginFailures.set(identity, {
    count,
    lastAttemptAt: now,
    lockedUntil: now + backoffSeconds * 1000,
  });

  return backoffSeconds;
}

export function clearLoginFailures(identity: string) {
  loginFailures.delete(identity);
}

// ─── Consume helper ───────────────────────────────────────────────────────────

async function consume(limiter: LimiterLike, key: string): Promise<RateLimitResult> {
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
    const hasRateData =
      typeof rej === "object" &&
      rej !== null &&
      "msBeforeNext" in rej &&
      typeof (rej as { msBeforeNext?: number }).msBeforeNext === "number";

    if (!hasRateData) {
      // Fail open for limiter backend outages; auth and CSRF checks still apply.
      safeLogError("Rate limiter backend error", rej);
      return {
        allowed: true,
        remaining: Number.MAX_SAFE_INTEGER,
        reset: Date.now() + 1000,
        retryAfterSeconds: 1,
      };
    }

    const msBeforeNext = (rej as { msBeforeNext: number }).msBeforeNext;
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

export function checkLoginIdentityLimit(key: string) {
  return consume(loginIdentityLimiter, key);
}

export function checkLoginBurstLimit(key: string) {
  return consume(loginBurstLimiter, key);
}

export function checkSetupLimit(key: string) {
  return consume(setupLimiter, key);
}

export function checkAdminActionLimit(key: string) {
  return consume(adminActionLimiter, key);
}

export function checkAdminReadLimit(key: string) {
  return consume(adminReadLimiter, key);
}

export function checkCspReportLimit(key: string) {
  return consume(cspReportLimiter, key);
}

export function getRateLimitHeaders(result: RateLimitResult): RateLimitHeaders {
  return {
    "Retry-After": String(Math.max(1, result.retryAfterSeconds)),
    "X-RateLimit-Remaining": String(Math.max(0, result.remaining)),
    "X-RateLimit-Reset": String(Math.ceil(result.reset / 1000)),
  };
}
