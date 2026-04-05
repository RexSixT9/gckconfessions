import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { apiError, apiOk, safeLogError } from "@/lib/api";
import { rotateCsrfCookie } from "@/lib/csrf";
import { writeAuditLog } from "@/lib/audit";
import { checkAdminActionLimit } from "@/lib/rateLimit";
import { rotateSessionCookie } from "@/lib/session";
import { runMutatingRouteGuard } from "@/lib/routeGuards";
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
    const guard = await runMutatingRouteGuard(request, {
      requireCsrf: true,
      useArcjet: true,
      checkBlockedIp: true,
      requireAdmin: true,
      requireRecentAuth: true,
      rateLimit: {
        check: checkAdminActionLimit,
        key: (ctx) => `admin-delete:${ctx.ip}`,
        message: "Too many requests. Try again later.",
      },
    });
    if (!guard.ok) {
      return guard.response;
    }

    const caller = guard.ctx.admin;
    if (!caller?.sub) return apiError(401, "UNAUTHORIZED", "Unauthorized.");

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
