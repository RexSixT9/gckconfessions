import { createHash } from "crypto";
import { cookies } from "next/headers";
import { connectToDatabase } from "@/lib/mongodb";
import { ensureCsrfCookie } from "@/lib/csrf";
import { verifyAdminTokenSafe } from "@/lib/auth";
import { COOKIE_NAME } from "@/lib/constants";
import { apiAuthError, apiError, apiOk, safeLogError } from "@/lib/api";
import { checkAdminReadLimit, getClientIp, getRateLimitHeaders } from "@/lib/rateLimit";
import Confession from "@/models/Confession";

function matchesIfNoneMatch(headerValue: string | null, etag: string) {
  if (!headerValue) return false;
  const candidates = headerValue.split(",").map((value) => value.trim());
  return candidates.includes("*") || candidates.includes(etag);
}

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    const auth = await verifyAdminTokenSafe(token);
    if (!auth.ok) {
      return apiAuthError(auth.reason);
    }

    const readRate = await checkAdminReadLimit(`admin-stats:${getClientIp(request)}`);
    if (!readRate.allowed) {
      return apiError(429, "RATE_LIMIT", "Too many requests. Try again later.", getRateLimitHeaders(readRate));
    }

    await connectToDatabase();
    const [pending, approved, rejected] = await Promise.all([
      Confession.countDocuments({ status: "pending" }),
      Confession.countDocuments({ status: "approved" }),
      Confession.countDocuments({ status: "rejected" }),
    ]);

    const snapshot = {
      pending,
      approved,
      rejected,
      total: pending + approved + rejected,
    };
    const etag = `"${createHash("sha256").update(JSON.stringify(snapshot)).digest("base64url")}"`;

    if (matchesIfNoneMatch(request.headers.get("if-none-match"), etag)) {
      return new Response(null, {
        status: 304,
        headers: {
          "Cache-Control": "private, no-store, max-age=0",
          ETag: etag,
          Vary: "Cookie, If-None-Match",
        },
      });
    }

    const response = apiOk(
      snapshot,
      200,
      {
        "Cache-Control": "private, no-store, max-age=0",
        ETag: etag,
        Vary: "Cookie, If-None-Match",
      }
    );

    // Intentionally disabled for now to reduce high-volume "viewed" audit noise.

    await ensureCsrfCookie(response);
    return response;
  } catch (error) {
    safeLogError("Admin stats error", error);
    return apiError(500, "SERVER_ERROR", "Failed to load stats.");
  }
}
