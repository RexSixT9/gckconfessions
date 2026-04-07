import { cookies } from "next/headers";
import { aj } from "@/lib/arcjet";
import { verifyAdminTokenSafe, type AdminTokenPayload } from "@/lib/auth";
import { COOKIE_NAME } from "@/lib/constants";
import { validateCsrf } from "@/lib/csrf";
import { apiAuthError, apiError, isJsonContentType, safeLogError, type ApiErrorCode } from "@/lib/api";
import {
  getBlockedIps,
  getClientIp,
  getRateLimitHeaders,
  type RateLimitResult,
} from "@/lib/rateLimit";
import { isSameOrigin } from "@/lib/requestUtils";
import { requiresReauth } from "@/lib/session";

export type MutatingRouteGuardContext = {
  ip: string;
  token: string | null;
  admin: AdminTokenPayload | null;
  rateLimit: RateLimitResult | null;
};

type RateLimitConfig = {
  check: (key: string) => Promise<RateLimitResult>;
  key: string | ((ctx: MutatingRouteGuardContext) => string);
  message: string;
  code?: ApiErrorCode;
  status?: number;
  includeHeaders?: boolean;
};

type MutatingRouteGuardOptions = {
  enforceOrigin?: boolean;
  requireJson?: boolean;
  requireCsrf?: boolean;
  useArcjet?: boolean;
  arcjetBlockedMessage?: string;
  checkBlockedIp?: boolean;
  requireAdmin?: boolean;
  requireRecentAuth?: boolean;
  unauthorizedMessage?: string;
  reauthMessage?: string;
  rateLimit?: RateLimitConfig;
};

type MutatingRouteGuardResult =
  | { ok: true; ctx: MutatingRouteGuardContext }
  | { ok: false; response: Response };

const DEFAULT_UNAUTHORIZED_MESSAGE = "Unauthorized.";
const DEFAULT_REAUTH_MESSAGE = "Please sign in again before this sensitive action.";

function unauthorizedResponse(reason: "missing_auth" | "invalid_token" | "expired_token", message: string) {
  if (message !== DEFAULT_UNAUTHORIZED_MESSAGE) {
    return apiError(401, "UNAUTHORIZED", message);
  }
  return apiAuthError(reason);
}

export async function runMutatingRouteGuard(
  request: Request,
  options: MutatingRouteGuardOptions = {}
): Promise<MutatingRouteGuardResult> {
  const {
    enforceOrigin = true,
    requireJson = false,
    requireCsrf = false,
    useArcjet = true,
    arcjetBlockedMessage = "Request blocked.",
    checkBlockedIp = false,
    requireAdmin = false,
    requireRecentAuth = false,
    unauthorizedMessage = DEFAULT_UNAUTHORIZED_MESSAGE,
    reauthMessage = DEFAULT_REAUTH_MESSAGE,
    rateLimit,
  } = options;

  if (enforceOrigin && !isSameOrigin(request)) {
    return {
      ok: false,
      response: apiError(403, "INVALID_ORIGIN", "Invalid origin."),
    };
  }

  if (requireJson && !isJsonContentType(request)) {
    return {
      ok: false,
      response: apiError(415, "INVALID_CONTENT_TYPE", "Unsupported content type."),
    };
  }

  if (requireCsrf && !(await validateCsrf(request))) {
    return {
      ok: false,
      response: apiError(403, "INVALID_CSRF", "Invalid CSRF token."),
    };
  }

  if (useArcjet) {
    let arcjetDecision: Awaited<ReturnType<typeof aj.protect>> | null = null;
    try {
      arcjetDecision = await aj.protect(request);
    } catch (arcjetError) {
      safeLogError("Arcjet error", arcjetError);
      return {
        ok: false,
        response: apiError(503, "SERVICE_UNAVAILABLE", "Request protection is temporarily unavailable."),
      };
    }

    if (arcjetDecision?.isDenied()) {
      return {
        ok: false,
        response: apiError(403, "FORBIDDEN", arcjetBlockedMessage),
      };
    }
  }

  const ctx: MutatingRouteGuardContext = {
    ip: getClientIp(request),
    token: null,
    admin: null,
    rateLimit: null,
  };

  if (checkBlockedIp && getBlockedIps().includes(ctx.ip)) {
    return {
      ok: false,
      response: apiError(403, "FORBIDDEN", "Access denied from this IP address."),
    };
  }

  const needsAdmin = requireAdmin || requireRecentAuth;
  if (needsAdmin) {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value ?? null;
    if (!token) {
      return {
        ok: false,
        response: unauthorizedResponse("missing_auth", unauthorizedMessage),
      };
    }

    const verified = await verifyAdminTokenSafe(token);
    if (!verified.ok) {
      return {
        ok: false,
        response: unauthorizedResponse(verified.reason, unauthorizedMessage),
      };
    }

    const admin: AdminTokenPayload = verified.payload;

    if (requireRecentAuth && requiresReauth(admin.iat ?? 0)) {
      return {
        ok: false,
        response: apiError(401, "REAUTH_REQUIRED", reauthMessage),
      };
    }

    ctx.token = token;
    ctx.admin = admin;
  }

  if (rateLimit) {
    const key = typeof rateLimit.key === "function" ? rateLimit.key(ctx) : rateLimit.key;
    const result = await rateLimit.check(key);
    ctx.rateLimit = result;

    if (!result.allowed) {
      const status = rateLimit.status ?? 429;
      const code = rateLimit.code ?? "RATE_LIMIT";
      const headers = rateLimit.includeHeaders === false ? undefined : getRateLimitHeaders(result);

      return {
        ok: false,
        response: apiError(status, code, rateLimit.message, headers),
      };
    }
  }

  return { ok: true, ctx };
}
