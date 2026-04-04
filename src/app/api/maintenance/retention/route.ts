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

function parseActionList(value: string) {
  return Array.from(
    new Set(
      value
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean)
    )
  );
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
    const staleAuditAnomalyDays = Number(process.env.RETENTION_AUDIT_ANOMALY_DAYS || 7);

    const highVolumeActions = parseActionList(
      process.env.RETENTION_AUDIT_HIGH_VOLUME_ACTIONS ||
        "admin_session_checked,audit_webhook_delivered,security_alert_webhook_delivered,security_alert_email_delivered"
    );
    const anomalyActions = parseActionList(
      process.env.RETENTION_AUDIT_ANOMALY_ACTIONS ||
        "security_alert,admin_login_failed,admin_setup_failed,audit_webhook_failed,security_alert_webhook_failed,security_alert_email_failed"
    );

    // Keep buckets non-overlapping so each deleted record is counted once.
    const anomalyActionSet = new Set(anomalyActions);
    const highVolumeWithoutAnomaly = highVolumeActions.filter((action) => !anomalyActionSet.has(action));
    const standardExcludedActions = Array.from(new Set([...anomalyActions, ...highVolumeWithoutAnomaly]));

    const stalePendingBefore = new Date(now - stalePendingDays * 24 * 60 * 60 * 1000);
    const staleRejectedBefore = new Date(now - staleRejectedDays * 24 * 60 * 60 * 1000);
    const staleAuditBefore = new Date(now - staleAuditDays * 24 * 60 * 60 * 1000);
    const staleAuditHighVolumeBefore = new Date(now - staleAuditHighVolumeDays * 24 * 60 * 60 * 1000);
    const staleAuditAnomalyBefore = new Date(now - staleAuditAnomalyDays * 24 * 60 * 60 * 1000);

    const [pendingRes, rejectedRes, deletedBackupRes, auditAnomalyRes, auditHighVolumeRes, auditStandardRes] = await Promise.all([
      Confession.deleteMany({ status: "pending", createdAt: { $lt: stalePendingBefore } }),
      Confession.deleteMany({ status: "rejected", createdAt: { $lt: staleRejectedBefore } }),
      DeletedConfession.deleteMany({ deletedAt: { $lt: staleRejectedBefore } }),
      AuditLog.collection.deleteMany({
        action: { $in: anomalyActions },
        createdAt: { $lt: staleAuditAnomalyBefore },
      }),
      AuditLog.collection.deleteMany({
        action: { $in: highVolumeWithoutAnomaly },
        createdAt: { $lt: staleAuditHighVolumeBefore },
      }),
      AuditLog.collection.deleteMany({
        action: { $nin: standardExcludedActions },
        createdAt: { $lt: staleAuditBefore },
      }),
    ]);

    return apiOk({
      ok: true,
      deleted: {
        pending: pendingRes.deletedCount,
        rejected: rejectedRes.deletedCount,
        deletedBackups: deletedBackupRes.deletedCount,
        auditLogsAnomaly: auditAnomalyRes.deletedCount,
        auditLogsHighVolume: auditHighVolumeRes.deletedCount,
        auditLogsStandard: auditStandardRes.deletedCount,
        auditLogsTotal:
          auditAnomalyRes.deletedCount +
          auditHighVolumeRes.deletedCount +
          auditStandardRes.deletedCount,
      },
      retention: {
        auditDays: staleAuditDays,
        auditHighVolumeDays: staleAuditHighVolumeDays,
        auditAnomalyDays: staleAuditAnomalyDays,
      },
    });
  } catch (error) {
    safeLogError("Retention cleanup failed", error);
    return apiError(500, "SERVER_ERROR", "Cleanup failed");
  }
}
