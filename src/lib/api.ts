import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "UNAUTHORIZED"
  | "AUTH_REQUIRED"
  | "INVALID_AUTH_TOKEN"
  | "TOKEN_EXPIRED"
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

export type AuthErrorReason = "missing_auth" | "invalid_token" | "expired_token";

function withHeaders(base: HeadersInit | undefined, extra: Record<string, string>) {
  const merged = new Headers(base);
  for (const [key, value] of Object.entries(extra)) {
    merged.set(key, value);
  }
  return merged;
}

export function apiAuthError(
  reason: AuthErrorReason,
  options?: { message?: string; headers?: HeadersInit }
) {
  switch (reason) {
    case "missing_auth":
      return apiError(
        401,
        "AUTH_REQUIRED",
        options?.message ?? "Authentication is required.",
        withHeaders(options?.headers, {
          "WWW-Authenticate": 'Bearer realm="admin", error="invalid_request", error_description="missing authentication"',
        })
      );

    case "expired_token":
      return apiError(
        401,
        "TOKEN_EXPIRED",
        options?.message ?? "Session expired. Please sign in again.",
        withHeaders(options?.headers, {
          "WWW-Authenticate": 'Bearer realm="admin", error="invalid_token", error_description="token expired"',
        })
      );

    default:
      return apiError(
        401,
        "INVALID_AUTH_TOKEN",
        options?.message ?? "Invalid authentication token.",
        withHeaders(options?.headers, {
          "WWW-Authenticate": 'Bearer realm="admin", error="invalid_token"',
        })
      );
  }
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
