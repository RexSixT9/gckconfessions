import { cookies } from "next/headers";
import { connectToDatabase } from "@/lib/mongodb";
import { verifyAdminToken } from "@/lib/auth";
import { COOKIE_NAME } from "@/lib/constants";
import { apiError, apiOk, safeLogError } from "@/lib/api";
import { writeAuditLog } from "@/lib/audit";
import AuditLog from "@/models/AuditLog";

type Bucket = {
  action: string;
  adminEmail: string;
  ipHash: string;
  count: number;
  latestAt: string;
};

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return apiError(401, "UNAUTHORIZED", "Unauthorized.");

    const admin = await verifyAdminToken(token);
    if (!admin.sub) return apiError(401, "UNAUTHORIZED", "Unauthorized.");

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const days = Math.max(1, Math.min(90, Number(searchParams.get("days") || "7")));
    const limit = Math.max(1, Math.min(200, Number(searchParams.get("limit") || "50")));
    const adminEmailFilter = (searchParams.get("adminEmail") || "").trim().toLowerCase();
    const actionsParam = (searchParams.get("actions") || "").trim();
    const actions = actionsParam
      ? actionsParam.split(",").map((entry) => entry.trim()).filter(Boolean)
      : [];

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const match: Record<string, unknown> = {
      createdAt: { $gte: since },
    };

    if (adminEmailFilter) {
      match.adminEmail = adminEmailFilter;
    }

    if (actions.length > 0) {
      match.action = { $in: actions };
    }

    const grouped = await AuditLog.aggregate<Bucket>([
      { $match: match },
      {
        $group: {
          _id: {
            action: "$action",
            adminEmail: "$adminEmail",
            ipHash: "$ipHash",
          },
          count: { $sum: 1 },
          latestAt: { $max: "$createdAt" },
        },
      },
      { $sort: { count: -1, latestAt: -1 } },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          action: "$_id.action",
          adminEmail: "$_id.adminEmail",
          ipHash: "$_id.ipHash",
          count: 1,
          latestAt: {
            $dateToString: {
              date: "$latestAt",
              format: "%Y-%m-%dT%H:%M:%S.%LZ",
            },
          },
        },
      },
    ]);

    const totalsByAction = await AuditLog.aggregate<Array<{ action: string; count: number }>>([
      { $match: match },
      { $group: { _id: "$action", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $project: { _id: 0, action: "$_id", count: 1 } },
      { $limit: 30 },
    ]);

    await writeAuditLog({
      action: "audit_dashboard_viewed",
      request,
      adminEmail: admin.email,
      meta: {
        days,
        limit,
        actionsFilterCount: actions.length,
        adminEmailFiltered: Boolean(adminEmailFilter),
      },
    }).catch((error) => {
      safeLogError("AuditLog write failed (audit summary)", error);
    });

    return apiOk({
      windowDays: days,
      groupedByActionAdminIpHash: grouped,
      totalsByAction,
    });
  } catch (error) {
    safeLogError("Audit summary error", error);
    return apiError(500, "SERVER_ERROR", "Failed to load audit summary.");
  }
}
