/**
 * Application-wide constants and configuration
 */

// ── Session duration (single source of truth) ────────────────────────────────
/** Session lifetime in hours — both the cookie maxAge and JWT expiration
 *  are derived from this value so they can never drift apart. */
export const SESSION_DURATION_HOURS = 8;
export const COOKIE_MAX_AGE = SESSION_DURATION_HOURS * 60 * 60; // seconds
export const TOKEN_EXPIRATION = `${SESSION_DURATION_HOURS}h` as const;
export const ADMIN_IDLE_TIMEOUT_SECONDS = 15 * 60;
export const SENSITIVE_REAUTH_WINDOW_SECONDS = 10 * 60;

// ── Cookie configuration ─────────────────────────────────────────────────────
export const COOKIE_NAME = "gck_admin_token" as const;
export const CSRF_COOKIE_NAME = "gck_csrf" as const;
export const SESSION_ACTIVITY_COOKIE = "gck_admin_last_active" as const;

const rawCookieDomain = (process.env.ADMIN_COOKIE_DOMAIN ?? "").trim().toLowerCase();
const cookieDomain = rawCookieDomain || undefined;

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
  ...(process.env.NODE_ENV === "production" && cookieDomain ? { domain: cookieDomain } : {}),
};

// ── Rate limiting ────────────────────────────────────────────────────────────
export const MAX_LOGIN_ATTEMPTS = 5;
export const LOGIN_RATE_WINDOW = 15 * 60 * 1000; // 15 minutes

// ── Security constraints ─────────────────────────────────────────────────────
export const MAX_EMAIL_LENGTH = 254; // RFC 5321
export const MAX_PASSWORD_LENGTH = 128;
export const MAX_MESSAGE_LENGTH = 1000;
export const MAX_MUSIC_LENGTH = 120;
export const MIN_PASSWORD_LENGTH = 12;

// ── Bcrypt ───────────────────────────────────────────────────────────────────
export const BCRYPT_ROUNDS = 12;

// ── Session ──────────────────────────────────────────────────────────────────
export const MAX_SESSIONS_PER_USER = 5;
