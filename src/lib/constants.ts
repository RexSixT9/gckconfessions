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
