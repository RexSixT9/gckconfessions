import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { apiError, apiOk, parseJsonObject, safeLogError } from "@/lib/api";
import { rotateCsrfCookie } from "@/lib/csrf";
import { writeAuditLog } from "@/lib/audit";
import { checkAdminActionLimit } from "@/lib/rateLimit";
import { sanitizeOutputText } from "@/lib/moderation";
import { rotateSessionCookie } from "@/lib/session";
import { runMutatingRouteGuard } from "@/lib/routeGuards";
import Confession from "@/models/Confession";
import DeletedConfession from "@/models/DeletedConfession";

type ConfessionResponse = {
  _id: string;
  message: string;
  music: string;
  status: "pending" | "approved" | "rejected";
  posted: boolean;
  createdAt?: string;
  updatedAt?: string;
};

function serializeConfession(item: {
  _id: unknown;
  message?: string;
  music?: string;
  status?: string;
  posted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}): ConfessionResponse {
  return {
    _id: String(item._id),
    message: sanitizeOutputText(item.message ?? "", 1000),
    music: sanitizeOutputText(item.music ?? "", 120),
    status:
      item.status === "approved" || item.status === "rejected"
        ? item.status
        : "pending",
    posted: Boolean(item.posted),
    createdAt: item.createdAt?.toISOString(),
    updatedAt: item.updatedAt?.toISOString(),
  };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await runMutatingRouteGuard(request, {
      requireJson: true,
      requireCsrf: true,
      useArcjet: true,
      checkBlockedIp: true,
      requireAdmin: true,
      rateLimit: {
        check: checkAdminActionLimit,
        key: (ctx) => `confession-patch:${ctx.ip}`,
        message: "Too many requests. Try again later.",
      },
    });
    if (!guard.ok) {
      return guard.response;
    }

    const admin = guard.ctx.admin;
    const adminRate = guard.ctx.rateLimit;
    if (!admin?.sub || !adminRate) {
      return apiError(500, "SERVER_ERROR", "Authentication context unavailable.");
    }

    if (adminRate.remaining <= 2) {
      await writeAuditLog({
        action: "security_alert",
        request,
        adminEmail: admin.email,
        meta: {
          type: "moderation_spike",
          endpoint: "confession_patch",
          remaining: adminRate.remaining,
        },
      }).catch(() => {
        // Best-effort alerting only
      });
    }

    const { id } = await params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return apiError(400, "VALIDATION_ERROR", "Invalid confession id.");
    }

    const body = await parseJsonObject(request);
    if (!body) {
      return apiError(400, "INVALID_JSON", "Invalid request payload.");
    }

    const payload = body;
    const posted = typeof payload.posted === "boolean" ? payload.posted : undefined;
    const status = typeof payload.status === "string" && payload.status !== "" ? payload.status : undefined;

    if (posted === undefined && status === undefined) {
      return apiError(400, "VALIDATION_ERROR", "No updates provided.");
    }

    if (status !== undefined && !["pending", "approved", "rejected"].includes(status)) {
      return apiError(400, "VALIDATION_ERROR", "Invalid status.");
    }

    await connectToDatabase();

    // Fetch current confession to enforce state transitions
    const current = await Confession.findById(id).lean<{
      _id: unknown;
      status?: string;
      posted?: boolean;
    }>();

    if (!current) {
      return apiError(404, "NOT_FOUND", "Confession not found.");
    }

    const effectiveStatus = status ?? current.status ?? "pending";

    // Guard: posted can only be set on approved confessions
    if (posted !== undefined && effectiveStatus !== "approved") {
      return apiError(400, "VALIDATION_ERROR", "Only approved confessions can be shared.");
    }

    const update: Record<string, unknown> = {};
    if (typeof posted === "boolean") update.posted = posted;
    if (status !== undefined) {
      update.status = status;
      // Auto-clear posted flag when moving away from approved
      if (status !== "approved") {
        update.posted = false;
      }
    }

    const confession = await Confession.findByIdAndUpdate(id, update, {
      new: true,
    }).lean<{
      _id: unknown;
      message?: string;
      music?: string;
      status?: string;
      posted?: boolean;
      createdAt?: Date;
      updatedAt?: Date;
    }>();

    if (!confession) {
      // Should not happen since we fetched above, but handle edge case
      return apiError(404, "NOT_FOUND", "Confession not found.");
    }

    try {
      if (status !== undefined && status !== (current.status ?? "pending")) {
        await writeAuditLog({
          action: "status_changed",
          request,
          adminEmail: admin.email,
          confessionId: id,
          meta: { from: current.status ?? "pending", to: status },
        });
      }

      if (posted !== undefined && posted !== Boolean(current.posted)) {
        await writeAuditLog({
          action: posted ? "published" : "unpublished",
          request,
          adminEmail: admin.email,
          confessionId: id,
          meta: { posted },
        });
      }

      if (Object.keys(update).length > 0) {
        await writeAuditLog({
          action: "confession_updated",
          request,
          adminEmail: admin.email,
          confessionId: id,
          meta: { update },
        });
      }
    } catch (logErr) {
      safeLogError("AuditLog write failed (PATCH)", logErr);
    }

    const response = apiOk({ confession: serializeConfession(confession) });
    await rotateSessionCookie(response, { sub: admin.sub, email: admin.email });
    await rotateCsrfCookie(response);
    return response;
  } catch (error) {
    safeLogError("Confession update error", error);
    return apiError(500, "SERVER_ERROR", "Failed to update confession.");
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let backupId: string | null = null;

  try {
    const guard = await runMutatingRouteGuard(request, {
      requireCsrf: true,
      useArcjet: true,
      checkBlockedIp: true,
      requireAdmin: true,
      requireRecentAuth: true,
      rateLimit: {
        check: checkAdminActionLimit,
        key: (ctx) => `confession-delete:${ctx.ip}`,
        message: "Too many requests. Try again later.",
      },
    });
    if (!guard.ok) {
      return guard.response;
    }

    const admin = guard.ctx.admin;
    const adminRate = guard.ctx.rateLimit;
    if (!admin?.sub || !adminRate) {
      return apiError(500, "SERVER_ERROR", "Authentication context unavailable.");
    }

    if (adminRate.remaining <= 2) {
      await writeAuditLog({
        action: "security_alert",
        request,
        adminEmail: admin.email,
        meta: {
          type: "moderation_spike",
          endpoint: "confession_delete",
          remaining: adminRate.remaining,
        },
      }).catch(() => {
        // Best-effort alerting only
      });
    }

    const { id } = await params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return apiError(400, "VALIDATION_ERROR", "Invalid confession id.");
    }

    await connectToDatabase();

    // Find the confession first
    const confession = await Confession.findById(id).lean<{
      _id: unknown;
      message: string;
      messageHash?: string;
      music?: string;
      status?: string;
      posted?: boolean;
      createdAt?: Date;
      updatedAt?: Date;
    }>();

    if (!confession) {
      return apiError(404, "NOT_FOUND", "Confession not found.");
    }

    // Backup to DeletedConfession collection before removing
    const backup = await DeletedConfession.create({
      originalId: String(confession._id),
      message: confession.message,
      messageHash: confession.messageHash,
      music: confession.music,
      status: confession.status,
      posted: confession.posted,
      originalCreatedAt: confession.createdAt,
      originalUpdatedAt: confession.updatedAt,
      deletedBy: admin.email,
      deletedAt: new Date(),
      deleteReason: "admin_delete",
    });
    backupId = String(backup._id);

    // Now remove from the main collection
    const deleted = await Confession.findByIdAndDelete(id).select({ _id: 1 }).lean();

    if (!deleted) {
      await DeletedConfession.findByIdAndDelete(backupId).catch((rollbackError) => {
        safeLogError("DeletedConfession rollback failed", rollbackError);
      });
      return apiError(404, "NOT_FOUND", "Confession not found.");
    }

    backupId = null;

    try {
      await writeAuditLog({
        action: "confession_deleted",
        request,
        adminEmail: admin.email,
        confessionId: id,
        meta: { confessionId: id, backedUp: true },
      });
    } catch (logErr) {
      safeLogError("AuditLog write failed (DELETE)", logErr);
    }

    const response = apiOk({ ok: true });
    await rotateSessionCookie(response, { sub: admin.sub, email: admin.email });
    await rotateCsrfCookie(response);
    return response;
  } catch (error) {
    if (backupId) {
      await DeletedConfession.findByIdAndDelete(backupId).catch((rollbackError) => {
        safeLogError("DeletedConfession rollback failed", rollbackError);
      });
    }

    safeLogError("Confession delete error", error);
    return apiError(500, "SERVER_ERROR", "Failed to delete confession.");
  }
}
