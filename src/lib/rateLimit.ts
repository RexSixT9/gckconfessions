import { RateLimiterMemory } from "rate-limiter-flexible";

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  reset: number;
};

export function getClientIp(request: Request) {
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
  points: 5,
  duration: 15 * 60,
});

const loginLimiter = new RateLimiterMemory({
  points: 5,
  duration: 10 * 60,
});

async function consume(limiter: RateLimiterMemory, key: string): Promise<RateLimitResult> {
  try {
    const res = await limiter.consume(key);
    return {
      allowed: true,
      remaining: res.remainingPoints,
      reset: Date.now() + res.msBeforeNext,
    };
  } catch (rej) {
    const reset = Date.now() + (rej instanceof Error ? 0 : rej.msBeforeNext);
    return { allowed: false, remaining: 0, reset };
  }
}

export function checkSubmissionLimit(key: string) {
  return consume(submissionLimiter, key);
}

export function checkLoginLimit(key: string) {
  return consume(loginLimiter, key);
}
