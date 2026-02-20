/**
 * Application-wide constants and configuration
 */

// Cookie configuration
export const COOKIE_NAME = "gck_admin_token" as const;
export const COOKIE_MAX_AGE = 60 * 60 * 8; // 8 hours in seconds

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
};

// Token expiration
export const TOKEN_EXPIRATION = "8h";

// Rate limiting
export const MAX_LOGIN_ATTEMPTS = 5;
export const LOGIN_RATE_WINDOW = 15 * 60 * 1000; // 15 minutes

// Security constraints
export const MAX_EMAIL_LENGTH = 254; // RFC 5321
export const MAX_PASSWORD_LENGTH = 128;
export const MAX_MESSAGE_LENGTH = 1000;
export const MAX_MUSIC_LENGTH = 120;
export const MIN_PASSWORD_LENGTH = 12;

// Bcrypt configuration
export const BCRYPT_ROUNDS = 10;

// Session configuration
export const MAX_SESSIONS_PER_USER = 5;
