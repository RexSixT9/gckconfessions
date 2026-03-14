import { cookies } from "next/headers";
import { connectToDatabase } from "@/lib/mongodb";
import { apiError, apiOk, safeLogError } from "@/lib/api";
import { ensureCsrfCookie } from "@/lib/csrf";
import { verifyAdminToken } from "@/lib/auth";
import { COOKIE_NAME } from "@/lib/constants";
import { sanitizeOutputText } from "@/lib/moderation";
import { MAX_MESSAGE_LENGTH, MAX_MUSIC_LENGTH } from "@/lib/constants";
import Confession from "@/models/Confession";

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
    message: sanitizeOutputText(item.message ?? "", MAX_MESSAGE_LENGTH),
    music: sanitizeOutputText(item.music ?? "", MAX_MUSIC_LENGTH),
    status:
      item.status === "approved" || item.status === "rejected"
        ? item.status
        : "pending",
    posted: Boolean(item.posted),
    createdAt: item.createdAt?.toISOString(),
    updatedAt: item.updatedAt?.toISOString(),
  };
}

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) {
      return apiError(401, "UNAUTHORIZED", "Unauthorized.");
    }

    try {
      await verifyAdminToken(token);
    } catch {
      return apiError(401, "UNAUTHORIZED", "Unauthorized.");
    }

    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim() ?? "";
    const status = searchParams.get("status") ?? "";
    const posted = searchParams.get("posted") ?? "";
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? "10")));

    const filter: Record<string, unknown> = {};

    if (query) {
      filter.$text = { $search: query };
    }

    const validStatuses = ["pending", "approved", "rejected"];
    if (status && !validStatuses.includes(status)) {
      return apiError(400, "VALIDATION_ERROR", "Invalid status filter.");
    }

    if (status && validStatuses.includes(status)) {
      filter.status = status;
    }

    if (posted === "true" || posted === "false") {
      filter.posted = posted === "true";
    }

    const [total, data] = await Promise.all([
      Confession.countDocuments(filter),
      Confession.find(filter)
        .select({ message: 1, music: 1, status: 1, posted: 1, createdAt: 1, updatedAt: 1 })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean<{
          _id: unknown;
          message?: string;
          music?: string;
          status?: string;
          posted?: boolean;
          createdAt?: Date;
          updatedAt?: Date;
        }[]>(),
    ]);

    const confessions = data.map(serializeConfession);

    const response = apiOk(
      {
        confessions,
        page,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
      200,
      {
        "Cache-Control": "no-store",
      }
    );
    await ensureCsrfCookie(response);
    return response;
  } catch (error) {
    safeLogError("Confession list error", error);
    return apiError(500, "SERVER_ERROR", "Failed to load confessions.");
  }
}

export async function POST() {
  return apiError(405, "METHOD_NOT_ALLOWED", "This endpoint is disabled on admin service.");
}
