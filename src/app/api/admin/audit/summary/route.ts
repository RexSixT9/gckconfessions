import { cookies } from "next/headers";
import { connectToDatabase } from "@/lib/mongodb";
import { verifyAdminTokenSafe } from "@/lib/auth";
import { COOKIE_NAME } from "@/lib/constants";
import { apiAuthError, apiError, apiOk, safeLogError } from "@/lib/api";
import { checkAdminReadLimit, getClientIp, getRateLimitHeaders } from "@/lib/rateLimit";
import AuditLog from "@/models/AuditLog";

type Bucket = {
  action: string;
  adminEmail: string;
  ipHash: string;
  count: number;
  latestAt: string;
};

function parseBoundedInt(
  value: string | null,
  fallback: number,
  min: number,
  max: number
): { ok: true; value: number } | { ok: false } {
  if (!value || value.trim() === "") {
    return { ok: true, value: fallback };
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed)) {
    return { ok: false };
  }

  return { ok: true, value: Math.max(min, Math.min(max, parsed)) };
}

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    const auth = await verifyAdminTokenSafe(token);
    if (!auth.ok) return apiAuthError(auth.reason);

    const rate = await checkAdminReadLimit(`audit-summary:${getClientIp(request)}`);
    if (!rate.allowed) {
      return apiError(429, "RATE_LIMIT", "Too many requests. Try again later.", getRateLimitHeaders(rate));
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const daysParam = parseBoundedInt(searchParams.get("days"), 7, 1, 90);
    if (!daysParam.ok) {
      return apiError(400, "VALIDATION_ERROR", "Invalid days query parameter.");
    }

    const limitParam = parseBoundedInt(searchParams.get("limit"), 50, 1, 200);
    if (!limitParam.ok) {
      return apiError(400, "VALIDATION_ERROR", "Invalid limit query parameter.");
    }

    const days = daysParam.value;
    const limit = limitParam.value;
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

    // Intentionally disabled for now to reduce high-volume "viewed" audit noise.

    return apiOk(
      {
        windowDays: days,
        groupedByActionAdminIpHash: grouped,
        totalsByAction,
      },
      200,
      { "Cache-Control": "private, no-store, max-age=0" }
    );
  } catch (error) {
    safeLogError("Audit summary error", error);
    return apiError(500, "SERVER_ERROR", "Failed to load audit summary.");
  }
}
