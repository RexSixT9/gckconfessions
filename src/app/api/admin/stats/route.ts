import { cookies } from "next/headers";
import { connectToDatabase } from "@/lib/mongodb";
import { ensureCsrfCookie } from "@/lib/csrf";
import { verifyAdminToken } from "@/lib/auth";
import { COOKIE_NAME } from "@/lib/constants";
import { apiError, apiOk, safeLogError } from "@/lib/api";
import Confession from "@/models/Confession";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) {
      return apiError(401, "UNAUTHORIZED", "Unauthorized.");
    }

    const payload = await verifyAdminToken(token);
    if (!payload.sub) {
      return apiError(401, "UNAUTHORIZED", "Unauthorized.");
    }

    await connectToDatabase();
    const [pending, approved, rejected] = await Promise.all([
      Confession.countDocuments({ status: "pending" }),
      Confession.countDocuments({ status: "approved" }),
      Confession.countDocuments({ status: "rejected" }),
    ]);

    const response = apiOk(
      {
        pending,
        approved,
        rejected,
        total: pending + approved + rejected,
      },
      200,
      { "Cache-Control": "no-store" }
    );
    await ensureCsrfCookie(response);
    return response;
  } catch (error) {
    safeLogError("Admin stats error", error);
    return apiError(500, "SERVER_ERROR", "Failed to load stats.");
  }
}
