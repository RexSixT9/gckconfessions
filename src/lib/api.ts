import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "INVALID_ORIGIN"
  | "INVALID_CSRF"
  | "INVALID_CONTENT_TYPE"
  | "INVALID_JSON"
  | "INVALID_PAYLOAD"
  | "VALIDATION_ERROR"
  | "RATE_LIMIT"
  | "NOT_FOUND"
  | "CONFLICT"
  | "SERVER_ERROR"
  | "SERVICE_UNAVAILABLE"
  | "REAUTH_REQUIRED"
  | "CHALLENGE_REQUIRED";

export function apiError(
  status: number,
  code: ApiErrorCode,
  message: string,
  headers?: HeadersInit
) {
  return NextResponse.json({ error: message, code }, { status, headers });
}

export function apiOk<T>(data: T, status = 200, headers?: HeadersInit) {
  return NextResponse.json(data, { status, headers });
}

export function isJsonContentType(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  return contentType.includes("application/json");
}

export async function parseJsonObject(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const body = (await request.json()) as unknown;
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return null;
    }
    return body as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function safeLogError(scope: string, error: unknown) {
  if (process.env.NODE_ENV !== "production") {
    console.error(scope, error);
    return;
  }
  console.error(scope);
}
