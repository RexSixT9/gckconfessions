import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { aj } from "@/lib/arcjet";
import { verifyAdminToken } from "@/lib/auth";
import { COOKIE_NAME } from "@/lib/constants";
import { getClientIp } from "@/lib/rateLimit";
import Confession from "@/models/Confession";
import DeletedConfession from "@/models/DeletedConfession";
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
    const status = typeof body.status === "string" && body.status !== "" ? body.status : undefined;

    if (posted === undefined && status === undefined) {
      return NextResponse.json(
        { error: "No updates provided." },
        { status: 400 }
      );
    }

    if (status !== undefined && !["pending", "approved", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }

    await connectToDatabase();

    // Fetch current confession to enforce state transitions
    const current = await Confession.findById(id).lean<{
      _id: unknown;
      status?: string;
      posted?: boolean;
    }>();

    if (!current) {
      return NextResponse.json(
        { error: "Confession not found." },
        { status: 404 }
      );
    }

    const effectiveStatus = status ?? current.status ?? "pending";

    // Guard: posted can only be set on approved confessions
    if (posted !== undefined && effectiveStatus !== "approved") {
      return NextResponse.json(
        { error: "Only approved confessions can be shared." },
        { status: 400 }
      );
    }

    const update: Record<string, unknown> = {};
    if (typeof posted === "boolean") update.posted = posted;
    if (status !== undefined) {
      update.status = status;
      // Auto-clear posted flag when moving away from approved
      if (status !== "approved") {
        update.posted = false;
      }
    }

    const confession = await Confession.findByIdAndUpdate(id, update, {
      new: true,
    }).lean();

    if (!confession) {
      // Should not happen since we fetched above, but handle edge case
      return NextResponse.json(
        { error: "Confession not found." },
        { status: 404 }
      );
    }

    try {
      await AuditLog.create({
        action: "confession_updated",
        adminEmail: admin.email,
        ip: getClientIp(request),
        meta: { confessionId: id, update },
      });
    } catch (logErr) {
      console.error("AuditLog write failed (PATCH):", logErr);
    }

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

export async function DELETE(
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
      return NextResponse.json({ error: "Request blocked." }, { status: 403 });
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

    await connectToDatabase();

    // Find the confession first
    const confession = await Confession.findById(id).lean<{
      _id: unknown;
      message: string;
      messageHash?: string;
      music?: string;
      status?: string;
      posted?: boolean;
      createdAt?: Date;
      updatedAt?: Date;
    }>();

    if (!confession) {
      return NextResponse.json({ error: "Confession not found." }, { status: 404 });
    }

    // Backup to DeletedConfession collection before removing
    await DeletedConfession.create({
      originalId: String(confession._id),
      message: confession.message,
      messageHash: confession.messageHash,
      music: confession.music,
      status: confession.status,
      posted: confession.posted,
      originalCreatedAt: confession.createdAt,
      originalUpdatedAt: confession.updatedAt,
      deletedBy: admin.email,
      deletedAt: new Date(),
      deleteReason: "admin_delete",
    });

    // Now remove from the main collection
    await Confession.findByIdAndDelete(id);

    try {
      await AuditLog.create({
        action: "confession_deleted",
        adminEmail: admin.email,
        ip: getClientIp(request),
        meta: { confessionId: id, backedUp: true },
      });
    } catch (logErr) {
      console.error("AuditLog write failed (DELETE):", logErr);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to delete confession.",
      },
      { status: 500 }
    );
  }
}
