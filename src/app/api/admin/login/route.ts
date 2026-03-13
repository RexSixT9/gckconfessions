import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";
import { aj } from "@/lib/arcjet";
import { apiError, apiOk, isJsonContentType, parseJsonObject, safeLogError } from "@/lib/api";
import { signAdminToken } from "@/lib/auth";
import { rotateCsrfCookie } from "@/lib/csrf";
import { writeAuditLog } from "@/lib/audit";
import {
  checkLoginIdentityLimit,
  checkLoginLimit,
  clearLoginFailures,
  getBlockedIps,
  getClientIp,
  getLoginBackoff,
  getRateLimitHeaders,
  registerLoginFailure,
} from "@/lib/rateLimit";
import {
  COOKIE_NAME,
  COOKIE_OPTIONS,
  COOKIE_MAX_AGE,
  MIN_PASSWORD_LENGTH,
  MAX_PASSWORD_LENGTH,
  SESSION_ACTIVITY_COOKIE,
} from "@/lib/constants";
import { isSameOrigin, isValidEmail } from "@/lib/requestUtils";
import Admin from "@/models/Admin";
const DUMMY_PASSWORD_HASH = "$2a$10$CwTycUXWue0Thq9StjUM0uJ8n9f5M5w7x1YgnSUQoqBYwygJyI072";

export async function POST(request: Request) {
  try {
    if (!isSameOrigin(request)) {
      return apiError(403, "INVALID_ORIGIN", "Invalid origin.");
    }

    if (!isJsonContentType(request)) {
      return apiError(415, "INVALID_CONTENT_TYPE", "Unsupported content type.");
    }

    let arcjetDecision;
    try {
      arcjetDecision = await aj.protect(request);
    } catch (arcjetError) {
      safeLogError("Arcjet error", arcjetError);
      arcjetDecision = null;
    }

    if (arcjetDecision?.isDenied()) {
      return apiError(403, "FORBIDDEN", "Login blocked.");
    }

    const ip = getClientIp(request);
    const blocked = getBlockedIps();

    if (blocked.includes(ip)) {
      return apiError(401, "UNAUTHORIZED", "Unauthorized.");
    }

    const payload = await parseJsonObject(request);
    if (!payload) {
      return apiError(400, "INVALID_JSON", "Invalid request payload.");
    }
    const email =
      typeof payload.email === "string"
        ? payload.email.toLowerCase().trim()
        : "";
    // Do NOT trim passwords — whitespace may be intentional
    const password = typeof payload.password === "string" ? payload.password : "";

    const rateKey = `login:${ip}`;
    const identityKey = `login-account:${email || "unknown"}`;
    const backoffSeconds = getLoginBackoff(identityKey);
    if (backoffSeconds > 0) {
      return apiError(429, "RATE_LIMIT", "Too many login attempts. Try again later.", {
        "Retry-After": String(backoffSeconds),
      });
    }

    const [rate, identityRate] = await Promise.all([
      checkLoginLimit(rateKey),
      checkLoginIdentityLimit(identityKey),
    ]);

    if (!rate.allowed || !identityRate.allowed) {
      const retrySource = rate.allowed ? identityRate : rate;
      return apiError(
        429,
        "RATE_LIMIT",
        "Too many login attempts. Try again later.",
        {
          ...getRateLimitHeaders(retrySource),
        }
      );
    }

    if (!email || !password) {
      return apiError(400, "VALIDATION_ERROR", "Email and password are required.");
    }

    if (!isValidEmail(email)) {
      return apiError(400, "VALIDATION_ERROR", "Invalid email address.");
    }

    if (password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
      return apiError(400, "VALIDATION_ERROR", `Password must be ${MIN_PASSWORD_LENGTH}-${MAX_PASSWORD_LENGTH} characters.`);
    }

    await connectToDatabase();
    const admin = await Admin.findOne({ email }).lean<{
      _id?: unknown;
      passwordHash?: string;
      email?: string;
    }>();

    // Always perform password comparison to prevent timing attacks
    const passwordHash = admin?.passwordHash;
    const hashToCompare = typeof passwordHash === "string" ? passwordHash : DUMMY_PASSWORD_HASH;
    let isValid = false;
    try {
      isValid = await bcrypt.compare(password, hashToCompare);
    } catch {
      isValid = false;
    }

    if (!admin || typeof passwordHash !== "string" || !isValid) {
      try {
        await writeAuditLog({
          action: "admin_login_failed",
          request,
          adminEmail: email,
          meta: { reason: "invalid_credentials", loginKey: identityKey },
        });
      } catch (logError) {
        safeLogError("Failed to log failed login attempt", logError);
      }

      const retryAfter = registerLoginFailure(identityKey);
      if (retryAfter >= 120) {
        await writeAuditLog({
          action: "security_alert",
          request,
          adminEmail: email,
          meta: {
            type: "failed_login_spike",
            identityKey,
            retryAfter,
          },
        }).catch(() => {
          // Alert path should not block response
        });
      }

      return apiError(401, "UNAUTHORIZED", "Invalid email or password.", {
        "Retry-After": String(retryAfter),
      });
    }

    clearLoginFailures(identityKey);

    const token = await signAdminToken({
      sub: String(admin._id ?? ""),
      email: admin.email ?? email,
    });

    try {
      await writeAuditLog({
        action: "admin_login",
        request,
        adminEmail: admin.email ?? email,
      });
    } catch (logErr) {
      safeLogError("AuditLog write failed (login)", logErr);
    }

    const response = apiOk({
      ok: true,
      message: "Login successful.",
      redirectTo: "/admin"
    }, 200, { "Cache-Control": "no-store" });

    // Set secure httpOnly cookie
    response.cookies.set(COOKIE_NAME, token, {
      ...COOKIE_OPTIONS,
      maxAge: COOKIE_MAX_AGE,
    });
    response.cookies.set(SESSION_ACTIVITY_COOKIE, String(Date.now()), {
      ...COOKIE_OPTIONS,
      maxAge: COOKIE_MAX_AGE,
    });
    await rotateCsrfCookie(response);

    return response;
  } catch (error) {
    safeLogError("Login error", error);
    return apiError(500, "SERVER_ERROR", "Failed to authenticate.");
  }
}
