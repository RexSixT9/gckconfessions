import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { aj } from "@/lib/arcjet";
import { writeAuditLog } from "@/lib/audit";
import { verifyAdminToken } from "@/lib/auth";
import { COOKIE_NAME } from "@/lib/constants";
import { checkAdminActionLimit, getClientIp, getRateLimitHeaders } from "@/lib/rateLimit";
import { isSameOrigin } from "@/lib/requestUtils";
import Confession from "@/models/Confession";
import DeletedConfession from "@/models/DeletedConfession";

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
    message: item.message ?? "",
    music: item.music ?? "",
    status:
      item.status === "approved" || item.status === "rejected"
        ? item.status
        : "pending",
    posted: Boolean(item.posted),
    createdAt: item.createdAt?.toISOString(),
    updatedAt: item.updatedAt?.toISOString(),
  };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isSameOrigin(request)) {
      return NextResponse.json({ error: "Invalid origin." }, { status: 403 });
    }

    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      return NextResponse.json({ error: "Unsupported content type." }, { status: 415 });
    }

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

    const adminRate = await checkAdminActionLimit(`confession-patch:${getClientIp(request)}`);
    if (!adminRate.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Try again later." },
        { status: 429, headers: getRateLimitHeaders(adminRate) }
      );
    }

    const { id } = await params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid confession id." }, { status: 400 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
    }

    const payload = body as Record<string, unknown>;
    const posted = typeof payload.posted === "boolean" ? payload.posted : undefined;
    const status = typeof payload.status === "string" && payload.status !== "" ? payload.status : undefined;

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
    }).lean<{
      _id: unknown;
      message?: string;
      music?: string;
      status?: string;
      posted?: boolean;
      createdAt?: Date;
      updatedAt?: Date;
    }>();

    if (!confession) {
      // Should not happen since we fetched above, but handle edge case
      return NextResponse.json(
        { error: "Confession not found." },
        { status: 404 }
      );
    }

    try {
      if (status !== undefined && status !== (current.status ?? "pending")) {
        await writeAuditLog({
          action: "status_changed",
          request,
          adminEmail: admin.email,
          confessionId: id,
          meta: { from: current.status ?? "pending", to: status },
        });
      }

      if (posted !== undefined && posted !== Boolean(current.posted)) {
        await writeAuditLog({
          action: posted ? "published" : "unpublished",
          request,
          adminEmail: admin.email,
          confessionId: id,
          meta: { posted },
        });
      }

      if (Object.keys(update).length > 0) {
        await writeAuditLog({
          action: "confession_updated",
          request,
          adminEmail: admin.email,
          confessionId: id,
          meta: { update },
        });
      }
    } catch (logErr) {
      console.error("AuditLog write failed (PATCH):", logErr);
    }

    return NextResponse.json({ confession: serializeConfession(confession) });
  } catch (error) {
    console.error("Confession update error:", error);
    return NextResponse.json(
      { error: "Failed to update confession." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let backupId: string | null = null;

  try {
    if (!isSameOrigin(request)) {
      return NextResponse.json({ error: "Invalid origin." }, { status: 403 });
    }

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

    const adminRate = await checkAdminActionLimit(`confession-delete:${getClientIp(request)}`);
    if (!adminRate.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Try again later." },
        { status: 429, headers: getRateLimitHeaders(adminRate) }
      );
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
    const backup = await DeletedConfession.create({
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
    backupId = String(backup._id);

    // Now remove from the main collection
    const deleted = await Confession.findByIdAndDelete(id).select({ _id: 1 }).lean();

    if (!deleted) {
      await DeletedConfession.findByIdAndDelete(backupId).catch((rollbackError) => {
        console.error("DeletedConfession rollback failed:", rollbackError);
      });
      return NextResponse.json({ error: "Confession not found." }, { status: 404 });
    }

    backupId = null;

    try {
      await writeAuditLog({
        action: "confession_deleted",
        request,
        adminEmail: admin.email,
        confessionId: id,
        meta: { confessionId: id, backedUp: true },
      });
    } catch (logErr) {
      console.error("AuditLog write failed (DELETE):", logErr);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (backupId) {
      await DeletedConfession.findByIdAndDelete(backupId).catch((rollbackError) => {
        console.error("DeletedConfession rollback failed:", rollbackError);
      });
    }

    console.error("Confession delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete confession." },
      { status: 500 }
    );
  }
}
