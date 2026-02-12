import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { aj } from "@/lib/arcjet";
import { verifyAdminToken } from "@/lib/auth";
import { COOKIE_NAME } from "@/lib/constants";
import { getClientIp } from "@/lib/rateLimit";
import Confession from "@/models/Confession";
import AuditLog from "@/models/AuditLog";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    let arcjetDecision;
    try {
      arcjetDecision = await aj.protect(request);
    } catch (arcjetError) {
      console.error("Arcjet error:", arcjetError);
      arcjetDecision = null;
    }

    if (arcjetDecision?.isDenied()) {
      return NextResponse.json(
        { error: "Request blocked." },
        { status: 403 }
      );
    }

    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const admin = await verifyAdminToken(token);

    if (!admin.sub) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id } = await params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid confession id." }, { status: 400 });
    }

    const body = await request.json();
    const posted = typeof body.posted === "boolean" ? body.posted : undefined;
    const status = typeof body.status === "string" ? body.status : undefined;

    if (posted === undefined && !status) {
      return NextResponse.json(
        { error: "No updates provided." },
        { status: 400 }
      );
    }

    if (status && !["pending", "approved"].includes(status)) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }

    await connectToDatabase();
    const update: Record<string, unknown> = {};
    if (typeof posted === "boolean") update.posted = posted;
    if (status) update.status = status;

    const confession = await Confession.findByIdAndUpdate(id, update, {
      new: true,
    }).lean();

    if (!confession) {
      return NextResponse.json(
        { error: "Confession not found." },
        { status: 404 }
      );
    }

    await AuditLog.create({
      action: "confession_update",
      adminEmail: admin.email,
      ip: getClientIp(request),
      meta: { confessionId: id, update },
    });

    return NextResponse.json({ confession });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update confession.",
      },
      { status: 500 }
    );
  }
}
