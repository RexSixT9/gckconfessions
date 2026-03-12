import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectToDatabase } from "@/lib/mongodb";
import { verifyAdminToken } from "@/lib/auth";
import { COOKIE_NAME } from "@/lib/constants";
import Confession from "@/models/Confession";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const payload = await verifyAdminToken(token);
    if (!payload.sub) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    await connectToDatabase();
    const [pending, approved, rejected] = await Promise.all([
      Confession.countDocuments({ status: "pending" }),
      Confession.countDocuments({ status: "approved" }),
      Confession.countDocuments({ status: "rejected" }),
    ]);

    return NextResponse.json(
      {
        pending,
        approved,
        rejected,
        total: pending + approved + rejected,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: "Failed to load stats." }, { status: 500 });
  }
}
