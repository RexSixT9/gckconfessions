/**
 * Shared request-level utilities used across API routes.
 */

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
