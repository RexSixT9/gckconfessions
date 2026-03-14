import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";
import { aj } from "@/lib/arcjet";
import { apiError, apiOk, isJsonContentType, parseJsonObject, safeLogError } from "@/lib/api";
import { validatePasswordPolicy } from "@/lib/moderation";
import { BCRYPT_ROUNDS, MAX_EMAIL_LENGTH } from "@/lib/constants";
import { checkSetupLimit, getBlockedIps, getClientIp, getRateLimitHeaders } from "@/lib/rateLimit";
import { isSameOrigin, isValidEmail, safeCompare } from "@/lib/requestUtils";
import Admin from "@/models/Admin";

export async function POST(request: Request) {
  try {
    if (process.env.NODE_ENV === "production" && process.env.ADMIN_SETUP_ENABLED !== "true") {
      return apiError(404, "NOT_FOUND", "Not found.");
    }

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
      return apiError(403, "FORBIDDEN", "Setup blocked.");
    }

    const ip = getClientIp(request);

    if (getBlockedIps().includes(ip)) {
      return apiError(401, "UNAUTHORIZED", "Unauthorized.");
    }

    const rate = await checkSetupLimit(`setup:${ip}`);
    if (!rate.allowed) {
      return apiError(429, "RATE_LIMIT", "Too many setup attempts. Try again later.", {
        ...getRateLimitHeaders(rate),
      });
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

    if (email.length > MAX_EMAIL_LENGTH || !isValidEmail(email)) {
      return apiError(400, "VALIDATION_ERROR", "Invalid email address.");
    }

    if (!validatePasswordPolicy(password)) {
      return apiError(400, "VALIDATION_ERROR", "Password must be at least 12 characters and include uppercase, lowercase, number, and symbol.");
    }

    if (!safeCompare(providedKey, setupKey)) {
      return apiError(401, "UNAUTHORIZED", "Invalid setup key.");
    }

    await connectToDatabase();

    const existing = await Admin.findOne({ email }).select({ _id: 1 }).lean();
    if (existing) {
      return apiError(409, "CONFLICT", "An admin with that email already exists.");
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    await Admin.create({ email, passwordHash });

    return apiOk({ ok: true }, 201);
  } catch (error) {
    safeLogError("Admin setup error", error);
    return apiError(500, "SERVER_ERROR", "Failed to create admin.");
  }
}
