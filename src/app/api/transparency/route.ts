import { connectToDatabase } from "@/lib/mongodb";
import { apiError, apiOk, safeLogError } from "@/lib/api";
import { checkPublicAggregateLimit, getClientIp, getRateLimitHeaders } from "@/lib/rateLimit";
import Confession from "@/models/Confession";
import AuditLog from "@/models/AuditLog";

export async function GET(request: Request) {
  try {
    const rate = await checkPublicAggregateLimit(`transparency:${getClientIp(request)}`);
    if (!rate.allowed) {
      return apiError(429, "RATE_LIMIT", "Too many requests. Try again later.", getRateLimitHeaders(rate));
    }

    await connectToDatabase();

    const [pending, approved, rejected, published, moderationActions, totalAuditEvents] = await Promise.all([
      Confession.countDocuments({ status: "pending" }),
      Confession.countDocuments({ status: "approved" }),
      Confession.countDocuments({ status: "rejected" }),
      Confession.countDocuments({ posted: true }),
      AuditLog.countDocuments({ action: { $in: ["confession_updated", "confession_deleted", "status_changed", "published", "unpublished"] } }),
      AuditLog.countDocuments({}),
    ]);

    return apiOk(
      {
        queue: { pending, approved, rejected, published },
        moderationActions,
        totalAuditEvents,
        generatedAt: new Date().toISOString(),
      },
      200,
      {
        "Cache-Control": "public, max-age=30, s-maxage=30, stale-while-revalidate=120",
      }
    );
  } catch (error) {
    safeLogError("Transparency stats failed", error);
    return apiError(500, "SERVER_ERROR", "Failed to build transparency stats");
  }
}
