import { cookies } from "next/headers";
import { createHash, randomBytes, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { COOKIE_OPTIONS, CSRF_COOKIE_NAME } from "@/lib/constants";

function toToken(input: Buffer) {
  return input.toString("base64url");
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function createCsrfToken() {
  return toToken(randomBytes(32));
}

export async function ensureCsrfCookie(response: NextResponse) {
  const store = await cookies();
  const existing = store.get(CSRF_COOKIE_NAME)?.value;
  if (existing) return existing;

  const token = createCsrfToken();
  response.cookies.set(CSRF_COOKIE_NAME, token, {
    ...COOKIE_OPTIONS,
    httpOnly: false,
  });
  return token;
}

export async function rotateCsrfCookie(response: NextResponse) {
  const token = createCsrfToken();
  response.cookies.set(CSRF_COOKIE_NAME, token, {
    ...COOKIE_OPTIONS,
    httpOnly: false,
  });
  return token;
}

export async function validateCsrf(request: Request) {
  const store = await cookies();
  const cookieToken = store.get(CSRF_COOKIE_NAME)?.value ?? "";
  const headerToken = request.headers.get("x-csrf-token") ?? "";

  if (!cookieToken || !headerToken) {
    return false;
  }

  const cookieHash = Buffer.from(hashToken(cookieToken), "utf8");
  const headerHash = Buffer.from(hashToken(headerToken), "utf8");

  if (cookieHash.length !== headerHash.length) {
    return false;
  }

  return timingSafeEqual(cookieHash, headerHash);
}

export function readCsrfTokenFromDocumentCookie(cookieText: string) {
  const cookie = cookieText
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${CSRF_COOKIE_NAME}=`));

  if (!cookie) return "";
  return decodeURIComponent(cookie.slice(CSRF_COOKIE_NAME.length + 1));
}
