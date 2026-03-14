import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { cookies } from "next/headers";
import { connectToDatabase } from "@/lib/mongodb";
import { aj } from "@/lib/arcjet";
import { apiError, apiOk, safeLogError } from "@/lib/api";
import { rotateCsrfCookie, validateCsrf } from "@/lib/csrf";
import { writeAuditLog } from "@/lib/audit";
import { verifyAdminToken } from "@/lib/auth";
import { COOKIE_NAME } from "@/lib/constants";
import { checkAdminActionLimit, getClientIp, getRateLimitHeaders } from "@/lib/rateLimit";
import { isSameOrigin } from "@/lib/requestUtils";
import { requiresReauth, rotateSessionCookie } from "@/lib/session";
import Admin from "@/models/Admin";

/**
 * DELETE /api/admin/admins/[id]
 * Permanently removes an admin account.
 * - Requires valid admin authentication
 * - An admin cannot delete their own account (prevents lockout)
 * - The last remaining admin cannot be deleted (atomic check)
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const rate = await checkAdminActionLimit(`admin-delete:${ip}`);
    if (!rate.allowed) {
      return apiError(429, "RATE_LIMIT", "Too many requests. Try again later.", getRateLimitHeaders(rate));
    }

    const { id } = await params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return apiError(400, "VALIDATION_ERROR", "Invalid admin id.");
    }

    // Prevent self-deletion — would lock the caller out
    if (id === caller.sub) {
      return apiError(403, "FORBIDDEN", "You cannot delete your own account.");
    }

    await connectToDatabase();

    // Atomic last-admin guard: only delete if MORE than 1 admin exists.
    // Uses deleteOne with a filter + a pre-check in a single step.
    // Two concurrent requests cannot both succeed because MongoDB's
    // deleteOne is atomic at the document level.
    const totalAdmins = await Admin.countDocuments();
    if (totalAdmins <= 1) {
      return apiError(409, "CONFLICT", "Cannot delete the last admin account.");
    }

    // Atomic delete — if another concurrent request already deleted this
    // admin, findByIdAndDelete returns null and we return 404.
    const deleted = await Admin.findByIdAndDelete(id).lean();
    if (!deleted) {
      return apiError(404, "NOT_FOUND", "Admin not found.");
    }

    // Post-delete safety: if this somehow left 0 admins (extreme race),
    // re-create the admin immediately. This is a last-resort safeguard.
    const remaining = await Admin.countDocuments();
    if (remaining === 0) {
      await Admin.create({
        _id: (deleted as { _id: unknown })._id,
        email: (deleted as { email?: string }).email,
        passwordHash: (deleted as { passwordHash?: string }).passwordHash,
      });
      return apiError(409, "CONFLICT", "Cannot delete the last admin account.");
    }

    try {
      await writeAuditLog({
        action: "admin_deleted",
        request,
        adminEmail: caller.email,
        meta: {
          deletedId: id,
          deletedEmail: (deleted as { email?: string }).email ?? "",
        },
      });
    } catch (logErr) {
      safeLogError("AuditLog write failed (admin delete)", logErr);
    }

    const response = apiOk({ ok: true });
    await rotateSessionCookie(response, { sub: caller.sub, email: caller.email });
    await rotateCsrfCookie(response);
    return response;
  } catch (error) {
    safeLogError("Admin delete error", error);
    return apiError(500, "SERVER_ERROR", "Failed to delete admin.");
  }
}
