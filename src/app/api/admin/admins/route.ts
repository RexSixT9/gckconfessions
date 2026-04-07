import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { connectToDatabase } from "@/lib/mongodb";
import { apiAuthError, apiError, apiOk, parseJsonObject, safeLogError } from "@/lib/api";
import { ensureCsrfCookie, rotateCsrfCookie } from "@/lib/csrf";
import { writeAuditLog } from "@/lib/audit";
import { verifyAdminTokenSafe } from "@/lib/auth";
import { validatePasswordPolicy } from "@/lib/moderation";
import { COOKIE_NAME, BCRYPT_ROUNDS, MAX_EMAIL_LENGTH } from "@/lib/constants";
import { checkSetupLimit } from "@/lib/rateLimit";
import { isValidEmail, safeCompare } from "@/lib/requestUtils";
import { rotateSessionCookie } from "@/lib/session";
import { runMutatingRouteGuard } from "@/lib/routeGuards";
import Admin from "@/models/Admin";

/**
 * GET /api/admin/admins
 * List all admin accounts (id + email + createdAt). Password hashes are never returned.
 */
export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    const auth = await verifyAdminTokenSafe(token);
    if (!auth.ok) return apiAuthError(auth.reason);

    const caller = auth.payload;

    await connectToDatabase();
    const admins = await Admin.find()
      .select({ _id: 1, email: 1, createdAt: 1 })
      .sort({ createdAt: 1 })
      .lean();

    const response = apiOk(
      {
        admins: admins.map((a) => ({
          _id: String(a._id),
          email: a.email,
          createdAt: (a as { createdAt?: Date }).createdAt?.toISOString() ?? null,
          isSelf: String(a._id) === caller.sub,
        })),
      },
      200,
      { "Cache-Control": "private, no-store, max-age=0" }
    );

    // Intentionally disabled for now to reduce high-volume "viewed" audit noise.

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
    const guard = await runMutatingRouteGuard(request, {
      requireJson: true,
      requireCsrf: true,
      useArcjet: true,
      checkBlockedIp: true,
      requireAdmin: true,
      requireRecentAuth: true,
      rateLimit: {
        check: checkSetupLimit,
        key: (ctx) => `admin-create:${ctx.ip}`,
        message: "Too many requests. Try again later.",
      },
    });
    if (!guard.ok) {
      return guard.response;
    }

    const caller = guard.ctx.admin;
    if (!caller) return apiError(500, "SERVER_ERROR", "Authentication context unavailable.");

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
