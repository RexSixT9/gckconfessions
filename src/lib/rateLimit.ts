import { RateLimiterMemory } from "rate-limiter-flexible";

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  reset: number;
};

export function getClientIp(request: Request) {
  if (process.env.NODE_ENV !== "production" && process.env.DEV_IP_OVERRIDE) {
    return process.env.DEV_IP_OVERRIDE;
  }

  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  const vercelForwarded = request.headers.get("x-vercel-forwarded-for");
  if (vercelForwarded) {
    return vercelForwarded.split(",")[0]?.trim() || "unknown";
  }

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip") || "unknown";
}

export function getBlockedIps() {
  const list = process.env.BLOCKED_IPS ?? "";
  return list
    .split(",")
    .map((ip) => ip.trim())
    .filter(Boolean);
}

const submissionLimiter = new RateLimiterMemory({
  points: process.env.NODE_ENV === "production" ? 3 : 5,
  duration: process.env.NODE_ENV === "production" ? 5 * 60 : 15 * 60,
  blockDurationMs: process.env.NODE_ENV === "production" ? 15 * 60 * 1000 : 0,
});

const loginLimiter = new RateLimiterMemory({
  points: process.env.NODE_ENV === "production" ? 3 : 5,
  duration: process.env.NODE_ENV === "production" ? 3 * 60 : 10 * 60,
  blockDurationMs: process.env.NODE_ENV === "production" ? 10 * 60 * 1000 : 0,
});

async function consume(limiter: RateLimiterMemory, key: string): Promise<RateLimitResult> {
  try {
    const res = await limiter.consume(key);
    return {
      allowed: true,
      remaining: res.remainingPoints,
      reset: Date.now() + res.msBeforeNext,
    };
  } catch (rej: unknown) {
    const hasMsBeforeNext =
      typeof rej === "object" &&
      rej !== null &&
      "msBeforeNext" in rej &&
      typeof (rej as { msBeforeNext?: number }).msBeforeNext === "number";
    const reset = Date.now() + (hasMsBeforeNext ? (rej as { msBeforeNext: number }).msBeforeNext : 0);
    return { allowed: false, remaining: 0, reset };
  }
}

export function checkSubmissionLimit(key: string) {
  return consume(submissionLimiter, key);
}

export function checkLoginLimit(key: string) {
  return consume(loginLimiter, key);
}
