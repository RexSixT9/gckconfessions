import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";
import { apiError, apiOk, parseJsonObject, safeLogError } from "@/lib/api";
import { signAdminToken } from "@/lib/auth";
import { rotateCsrfCookie } from "@/lib/csrf";
import { writeAuditLog } from "@/lib/audit";
import {
  checkLoginBurstLimit,
  checkLoginIdentityLimit,
  checkLoginLimit,
  clearLoginFailures,
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
import { getRequestFingerprint, isValidEmail } from "@/lib/requestUtils";
import { adminLoginSchema } from "@/lib/validation";
import { runMutatingRouteGuard } from "@/lib/routeGuards";
import Admin from "@/models/Admin";
const DUMMY_PASSWORD_HASH = "$2a$10$CwTycUXWue0Thq9StjUM0uJ8n9f5M5w7x1YgnSUQoqBYwygJyI072";

export async function POST(request: Request) {
  try {
    const guard = await runMutatingRouteGuard(request, {
      requireJson: true,
      useArcjet: true,
      arcjetBlockedMessage: "Login blocked.",
      checkBlockedIp: true,
    });
    if (!guard.ok) {
      return guard.response;
    }

    const ip = guard.ctx.ip;
    const fingerprint = getRequestFingerprint(request, ip);

    const payload = await parseJsonObject(request);
    if (!payload) {
      return apiError(400, "INVALID_JSON", "Invalid request payload.");
    }

    const parsed = adminLoginSchema.safeParse(payload);
    if (!parsed.success) {
      return apiError(400, "VALIDATION_ERROR", "Email and password are required.");
    }

    const email = parsed.data.email.toLowerCase().trim();
    // Do NOT trim passwords — whitespace may be intentional
    const password = parsed.data.password;

    const rateKey = `login:${ip}`;
    const ipBackoffKey = `login-ip:${ip}`;
    const identityKey = `login-account:${email || "unknown"}`;
    const burstKey = `login-burst:${fingerprint}`;
    const [identityBackoff, ipBackoff] = await Promise.all([
      getLoginBackoff(identityKey),
      getLoginBackoff(ipBackoffKey),
    ]);
    const backoffSeconds = Math.max(identityBackoff, ipBackoff);
    if (backoffSeconds > 0) {
      return apiError(429, "RATE_LIMIT", "Too many login attempts. Try again later.", {
        "Retry-After": String(backoffSeconds),
      });
    }

    const [rate, identityRate, burstRate] = await Promise.all([
      checkLoginLimit(rateKey),
      checkLoginIdentityLimit(identityKey),
      checkLoginBurstLimit(burstKey),
    ]);

    if (!rate.allowed || !identityRate.allowed || !burstRate.allowed) {
      const retrySource = !rate.allowed ? rate : !identityRate.allowed ? identityRate : burstRate;
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

      const [retryAfter, retryAfterByIp] = await Promise.all([
        registerLoginFailure(identityKey),
        registerLoginFailure(ipBackoffKey),
      ]);
      const effectiveRetryAfter = Math.max(retryAfter, retryAfterByIp);
      if (effectiveRetryAfter >= 120) {
        await writeAuditLog({
          action: "security_alert",
          request,
          adminEmail: email,
          meta: {
            type: "failed_login_spike",
            identityKey,
            retryAfter: effectiveRetryAfter,
            fingerprint,
          },
        }).catch(() => {
          // Alert path should not block response
        });
      }

      return apiError(401, "UNAUTHORIZED", "Invalid email or password.", {
        "Retry-After": String(effectiveRetryAfter),
      });
    }

    await Promise.all([
      clearLoginFailures(identityKey),
      clearLoginFailures(ipBackoffKey),
    ]);

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
