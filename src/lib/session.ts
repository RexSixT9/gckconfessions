import { NextResponse } from "next/server";
import {
  ADMIN_IDLE_TIMEOUT_SECONDS,
  COOKIE_NAME,
  COOKIE_OPTIONS,
  COOKIE_MAX_AGE,
  SESSION_ACTIVITY_COOKIE,
  SENSITIVE_REAUTH_WINDOW_SECONDS,
} from "@/lib/constants";
import { signAdminToken, type AdminTokenPayload } from "@/lib/auth";

export function isSessionIdle(lastActivityValue: string | undefined) {
  if (!lastActivityValue) return false;
  const lastMs = Number(lastActivityValue);
  if (!Number.isFinite(lastMs) || lastMs <= 0) return false;
  return Date.now() - lastMs > ADMIN_IDLE_TIMEOUT_SECONDS * 1000;
}

export function touchSessionActivity(response: NextResponse) {
  response.cookies.set(SESSION_ACTIVITY_COOKIE, String(Date.now()), {
    ...COOKIE_OPTIONS,
    httpOnly: true,
    maxAge: COOKIE_MAX_AGE,
  });
}

export function clearSessionCookies(response: NextResponse) {
  response.cookies.set(COOKIE_NAME, "", { ...COOKIE_OPTIONS, maxAge: 0 });
  response.cookies.set(SESSION_ACTIVITY_COOKIE, "", { ...COOKIE_OPTIONS, maxAge: 0 });
}

export function requiresReauth(iat: number) {
  if (!iat) return true;
  const now = Math.floor(Date.now() / 1000);
  return now - iat > SENSITIVE_REAUTH_WINDOW_SECONDS;
}

export async function rotateSessionCookie(response: NextResponse, payload: AdminTokenPayload) {
  const token = await signAdminToken(payload);
  response.cookies.set(COOKIE_NAME, token, {
    ...COOKIE_OPTIONS,
    maxAge: COOKIE_MAX_AGE,
  });
  touchSessionActivity(response);
}
