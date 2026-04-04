import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { connectToDatabase } from "@/lib/mongodb";
import { aj } from "@/lib/arcjet";
import { apiError, apiOk, isJsonContentType, parseJsonObject, safeLogError } from "@/lib/api";
import { ensureCsrfCookie, rotateCsrfCookie, validateCsrf } from "@/lib/csrf";
import { writeAuditLog } from "@/lib/audit";
import { verifyAdminToken } from "@/lib/auth";
import { validatePasswordPolicy } from "@/lib/moderation";
import { COOKIE_NAME, BCRYPT_ROUNDS, MAX_EMAIL_LENGTH } from "@/lib/constants";
import { checkSetupLimit, getBlockedIps, getClientIp, getRateLimitHeaders } from "@/lib/rateLimit";
import { isSameOrigin, isValidEmail, safeCompare } from "@/lib/requestUtils";
import { requiresReauth, rotateSessionCookie } from "@/lib/session";
import Admin from "@/models/Admin";

/**
 * GET /api/admin/admins
 * List all admin accounts (id + email + createdAt). Password hashes are never returned.
 */
export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return apiError(401, "UNAUTHORIZED", "Unauthorized.");

    const caller = await verifyAdminToken(token);
    if (!caller.sub) return apiError(401, "UNAUTHORIZED", "Unauthorized.");

    await connectToDatabase();
    const admins = await Admin.find()
      .select({ _id: 1, email: 1, createdAt: 1 })
      .sort({ createdAt: 1 })
      .lean();

    const response = apiOk({
      admins: admins.map((a) => ({
        _id: String(a._id),
        email: a.email,
        createdAt: (a as { createdAt?: Date }).createdAt?.toISOString() ?? null,
        isSelf: String(a._id) === caller.sub,
      })),
    });

    await writeAuditLog({
      action: "admins_viewed",
      request,
      adminEmail: caller.email,
      meta: {
        totalAdmins: admins.length,
      },
    }).catch((error) => {
      safeLogError("AuditLog write failed (admin list)", error);
    });

    await ensureCsrfCookie(response);
    return response;
  } catch (error) {
    safeLogError("Admin list error", error);
    return apiError(500, "SERVER_ERROR", "Failed to list admins.");
  }
}

/**
 * POST /api/admin/admins
 * Create a new admin account. Authenticated via ADMIN_SETUP_KEY.
 *
 * Body: { email: string; password: string; setupKey: string }
 */
export async function POST(request: Request) {
  try {
    if (!isSameOrigin(request)) {
      return apiError(403, "INVALID_ORIGIN", "Invalid origin.");
    }

    if (!(await validateCsrf(request))) {
      return apiError(403, "INVALID_CSRF", "Invalid CSRF token.");
    }

    let arcjetDecision;
    try {
      arcjetDecision = await aj.protect(request);
    } catch (arcjetError) {
      safeLogError("Arcjet error", arcjetError);
      arcjetDecision = null;
    }

    if (arcjetDecision?.isDenied()) {
      return apiError(403, "FORBIDDEN", "Request blocked.");
    }

    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return apiError(401, "UNAUTHORIZED", "Unauthorized.");

    const caller = await verifyAdminToken(token);
    if (!caller.sub) return apiError(401, "UNAUTHORIZED", "Unauthorized.");
    if (requiresReauth(caller.iat ?? 0)) {
      return apiError(401, "REAUTH_REQUIRED", "Please sign in again before this sensitive action.");
    }

    const ip = getClientIp(request);

    if (getBlockedIps().includes(ip)) {
      return apiError(401, "UNAUTHORIZED", "Unauthorized.");
    }

    const rate = await checkSetupLimit(`admin-create:${ip}`);
    if (!rate.allowed) {
      return apiError(429, "RATE_LIMIT", "Too many requests. Try again later.", getRateLimitHeaders(rate));
    }

    if (!isJsonContentType(request)) {
      return apiError(415, "INVALID_CONTENT_TYPE", "Unsupported content type.");
    }

    const setupKey = process.env.ADMIN_SETUP_KEY;
    if (!setupKey) {
      return apiError(500, "SERVER_ERROR", "ADMIN_SETUP_KEY is not configured.");
    }

    const body = await parseJsonObject(request);
    if (!body) {
      return apiError(400, "INVALID_JSON", "Invalid JSON payload.");
    }
    const email = String(body.email ?? "").toLowerCase().trim();
    // Do NOT trim passwords — whitespace may be intentional
    const password = String(body.password ?? "");
    const providedKey = String(body.setupKey ?? "").trim();

    if (!email || !password || !providedKey) {
      return apiError(400, "VALIDATION_ERROR", "Email, password, and setupKey are required.");
    }

    if (!safeCompare(providedKey, setupKey)) {
      return apiError(401, "UNAUTHORIZED", "Invalid setup key.");
    }

    if (email.length > MAX_EMAIL_LENGTH || !isValidEmail(email)) {
      return apiError(400, "VALIDATION_ERROR", "Invalid email address.");
    }

    if (!validatePasswordPolicy(password)) {
      return apiError(400, "VALIDATION_ERROR", "Password must be at least 12 characters and include uppercase, lowercase, number, and symbol.");
    }

    await connectToDatabase();

    const existing = await Admin.findOne({ email }).select({ _id: 1 }).lean();
    if (existing) {
      return apiError(409, "CONFLICT", "An admin with that email already exists.");
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const newAdmin = await Admin.create({ email, passwordHash });

    await writeAuditLog({
      action: "admin_created",
      request,
      adminEmail: email,
      meta: { createdEmail: email },
    });

    const response = apiOk(
      {
        admin: {
          _id: String(newAdmin._id),
          email: newAdmin.email,
          createdAt: (newAdmin as { createdAt?: Date }).createdAt?.toISOString() ?? null,
        },
        ok: true,
      },
      201
    );

    await rotateSessionCookie(response, { sub: caller.sub, email: caller.email });
    await rotateCsrfCookie(response);
    return response;
  } catch (error) {
    safeLogError("Admin create error", error);
    return apiError(500, "SERVER_ERROR", "Failed to create admin.");
  }
}
