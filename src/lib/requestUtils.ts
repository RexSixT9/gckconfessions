import { timingSafeEqual } from "crypto";
import { createHash } from "crypto";

/**
 * Shared request-level utilities used across API routes.
 */

/**
 * Timing-safe string comparison to prevent timing attacks.
 * Used for comparing secrets like setup keys.
 */
export function safeCompare(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  // Compare length first, then actual content to prevent timing leaks
  if (bufA.length !== bufB.length) {
    // Still do a comparison to maintain constant time
    timingSafeEqual(bufA, bufA);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

/**
 * Validates that the request Origin header matches the server Host.
 * Returns true for same-origin or requests without an Origin (e.g. server-to-server).
 */
export function isSameOrigin(request: Request): boolean {
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

/**
 * Basic RFC 5321 email format check.
 * Does NOT do full RFC 5322 parsing — just catches obviously bad values.
 */
export function isValidEmail(email: string): boolean {
  if (!email || email.length > 254) return false;
  // Must have exactly one @, non-empty local + domain parts
  const atIndex = email.lastIndexOf("@");
  if (atIndex < 1) return false;
  const local = email.slice(0, atIndex);
  const domain = email.slice(atIndex + 1);
  if (!local || !domain || !domain.includes(".")) return false;
  // No obvious invalid chars
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Lightweight request fingerprint used for abuse controls.
 * Avoids storing raw identifying values while still offering rate-limit stability.
 */
export function getRequestFingerprint(request: Request, ip: string): string {
  const ua = request.headers.get("user-agent") ?? "unknown";
  const lang = request.headers.get("accept-language") ?? "unknown";
  const encoding = request.headers.get("accept-encoding") ?? "unknown";

  return createHash("sha256")
    .update(`${ip}|${ua.slice(0, 80)}|${lang.slice(0, 32)}|${encoding.slice(0, 16)}`)
    .digest("hex")
    .slice(0, 24);
}

type DeviceType = "mobile" | "tablet" | "desktop" | "bot" | "unknown";

export type ClientContext = {
  ipHash: string;
  userAgent: string;
  deviceType: DeviceType;
  browser: string;
  os: string;
  model: string;
  platform: string;
  secChUa: string;
};

function normalizeHeaderValue(value: string | null, maxLen = 120) {
  if (!value) return "";
  return value.replace(/\s+/g, " ").trim().slice(0, maxLen);
}

function detectDeviceType(userAgent: string): DeviceType {
  const ua = userAgent.toLowerCase();
  if (!ua) return "unknown";
  if (/bot|crawler|spider|slurp|headless/.test(ua)) return "bot";
  if (/ipad|tablet|kindle|silk/.test(ua)) return "tablet";
  if (/mobile|iphone|ipod|android/.test(ua)) return "mobile";
  if (/windows|macintosh|linux|x11|cros/.test(ua)) return "desktop";
  return "unknown";
}

function detectBrowser(userAgent: string) {
  const ua = userAgent;
  if (/Edg\//.test(ua)) return "edge";
  if (/OPR\//.test(ua) || /Opera\//.test(ua)) return "opera";
  if (/Chrome\//.test(ua) && !/Edg\//.test(ua)) return "chrome";
  if (/Firefox\//.test(ua)) return "firefox";
  if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) return "safari";
  if (/PostmanRuntime|curl\//i.test(ua)) return "api-client";
  return "unknown";
}

function detectOs(userAgent: string) {
  const ua = userAgent;
  if (/Windows NT/i.test(ua)) return "windows";
  if (/Android/i.test(ua)) return "android";
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  if (/Mac OS X|Macintosh/i.test(ua)) return "macos";
  if (/Linux|X11/i.test(ua)) return "linux";
  if (/CrOS/i.test(ua)) return "chromeos";
  return "unknown";
}

export function hashIp(ip: string) {
  return createHash("sha256").update(ip).digest("hex").slice(0, 24);
}

export function getClientContext(request: Request, ip: string): ClientContext {
  const userAgent = normalizeHeaderValue(request.headers.get("user-agent"), 512);
  const secChUa = normalizeHeaderValue(request.headers.get("sec-ch-ua"));
  const model = normalizeHeaderValue(request.headers.get("sec-ch-ua-model"), 80) || "unknown";
  const platform = normalizeHeaderValue(request.headers.get("sec-ch-ua-platform"), 80) || "unknown";

  return {
    ipHash: hashIp(ip),
    userAgent,
    deviceType: detectDeviceType(userAgent),
    browser: detectBrowser(userAgent),
    os: detectOs(userAgent),
    model,
    platform,
    secChUa,
  };
}
