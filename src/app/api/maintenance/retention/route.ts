import { connectToDatabase } from "@/lib/mongodb";
import { apiError, apiOk, safeLogError } from "@/lib/api";
import Confession from "@/models/Confession";
import DeletedConfession from "@/models/DeletedConfession";
import AuditLog from "@/models/AuditLog";

function authorized(request: Request) {
  const expected = process.env.CRON_SECRET;
  const provided = request.headers.get("x-cron-secret");
  return Boolean(expected && provided && provided === expected);
}

export async function POST(request: Request) {
  try {
    if (!authorized(request)) {
      return apiError(401, "UNAUTHORIZED", "Unauthorized");
    }

    await connectToDatabase();

    const now = Date.now();
    const stalePendingDays = Number(process.env.RETENTION_PENDING_DAYS || 45);
    const staleRejectedDays = Number(process.env.RETENTION_REJECTED_DAYS || 90);
    const staleAuditDays = Number(process.env.RETENTION_AUDIT_DAYS || staleRejectedDays);
    const staleAuditHighVolumeDays = Number(process.env.RETENTION_AUDIT_HIGH_VOLUME_DAYS || 14);
    const highVolumeActions = (process.env.RETENTION_AUDIT_HIGH_VOLUME_ACTIONS || "admin_session_checked")
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);

    const stalePendingBefore = new Date(now - stalePendingDays * 24 * 60 * 60 * 1000);
    const staleRejectedBefore = new Date(now - staleRejectedDays * 24 * 60 * 60 * 1000);
    const staleAuditBefore = new Date(now - staleAuditDays * 24 * 60 * 60 * 1000);
    const staleAuditHighVolumeBefore = new Date(now - staleAuditHighVolumeDays * 24 * 60 * 60 * 1000);

    const [pendingRes, rejectedRes, deletedBackupRes, auditHighVolumeRes, auditStandardRes] = await Promise.all([
      Confession.deleteMany({ status: "pending", createdAt: { $lt: stalePendingBefore } }),
      Confession.deleteMany({ status: "rejected", createdAt: { $lt: staleRejectedBefore } }),
      DeletedConfession.deleteMany({ deletedAt: { $lt: staleRejectedBefore } }),
      AuditLog.collection.deleteMany({
        action: { $in: highVolumeActions },
        createdAt: { $lt: staleAuditHighVolumeBefore },
      }),
      AuditLog.collection.deleteMany({
        action: { $nin: highVolumeActions },
        createdAt: { $lt: staleAuditBefore },
      }),
    ]);

    return apiOk({
      ok: true,
      deleted: {
        pending: pendingRes.deletedCount,
        rejected: rejectedRes.deletedCount,
        deletedBackups: deletedBackupRes.deletedCount,
        auditLogsHighVolume: auditHighVolumeRes.deletedCount,
        auditLogsStandard: auditStandardRes.deletedCount,
        auditLogsTotal: auditHighVolumeRes.deletedCount + auditStandardRes.deletedCount,
      },
    });
  } catch (error) {
    safeLogError("Retention cleanup failed", error);
    return apiError(500, "SERVER_ERROR", "Cleanup failed");
  }
}
