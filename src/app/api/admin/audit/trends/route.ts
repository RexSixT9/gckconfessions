import { cookies } from "next/headers";
import { connectToDatabase } from "@/lib/mongodb";
import { verifyAdminToken } from "@/lib/auth";
import { COOKIE_NAME } from "@/lib/constants";
import { apiError, apiOk, safeLogError } from "@/lib/api";
import { checkAdminReadLimit, getClientIp, getRateLimitHeaders } from "@/lib/rateLimit";
import AuditLog from "@/models/AuditLog";

type Interval = "hour" | "day";

type TrendPoint = {
  bucket: string;
  action: string;
  count: number;
};

type BucketTotal = {
  bucket: string;
  total: number;
};

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return apiError(401, "UNAUTHORIZED", "Unauthorized.");

    const admin = await verifyAdminToken(token);
    if (!admin.sub) return apiError(401, "UNAUTHORIZED", "Unauthorized.");

    const rate = await checkAdminReadLimit(`audit-trends:${getClientIp(request)}`);
    if (!rate.allowed) {
      return apiError(429, "RATE_LIMIT", "Too many requests. Try again later.", getRateLimitHeaders(rate));
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const days = Math.max(1, Math.min(90, Number(searchParams.get("days") || "7")));
    const interval: Interval = searchParams.get("interval") === "hour" ? "hour" : "day";
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

    const bucketFormat = interval === "hour" ? "%Y-%m-%dT%H:00:00Z" : "%Y-%m-%d";

    const series = await AuditLog.aggregate<TrendPoint>([
      { $match: match },
      {
        $project: {
          action: 1,
          bucket: {
            $dateToString: {
              date: "$createdAt",
              format: bucketFormat,
              timezone: "UTC",
            },
          },
        },
      },
      {
        $group: {
          _id: {
            bucket: "$bucket",
            action: "$action",
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.bucket": 1, count: -1 } },
      {
        $project: {
          _id: 0,
          bucket: "$_id.bucket",
          action: "$_id.action",
          count: 1,
        },
      },
    ]);

    const totalsByBucket = await AuditLog.aggregate<BucketTotal>([
      { $match: match },
      {
        $project: {
          bucket: {
            $dateToString: {
              date: "$createdAt",
              format: bucketFormat,
              timezone: "UTC",
            },
          },
        },
      },
      {
        $group: {
          _id: "$bucket",
          total: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          bucket: "$_id",
          total: 1,
        },
      },
    ]);

    // Intentionally disabled for now to reduce high-volume "viewed" audit noise.

    return apiOk(
      {
        windowDays: days,
        interval,
        series,
        totalsByBucket,
      },
      200,
      { "Cache-Control": "private, no-store, max-age=0" }
    );
  } catch (error) {
    safeLogError("Audit trends error", error);
    return apiError(500, "SERVER_ERROR", "Failed to load audit trends.");
  }
}
