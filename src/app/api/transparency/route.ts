import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Confession from "@/models/Confession";
import AuditLog from "@/models/AuditLog";

export async function GET() {
  try {
    await connectToDatabase();

    const [pending, approved, rejected, published, moderationActions, totalAuditEvents] = await Promise.all([
      Confession.countDocuments({ status: "pending" }),
      Confession.countDocuments({ status: "approved" }),
      Confession.countDocuments({ status: "rejected" }),
      Confession.countDocuments({ posted: true }),
      AuditLog.countDocuments({ action: { $in: ["confession_updated", "confession_deleted", "status_changed", "published", "unpublished"] } }),
      AuditLog.countDocuments({}),
    ]);

    return NextResponse.json({
      queue: { pending, approved, rejected, published },
      moderationActions,
      totalAuditEvents,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Transparency stats failed", error);
    return NextResponse.json({ error: "Failed to build transparency stats" }, { status: 500 });
  }
}
