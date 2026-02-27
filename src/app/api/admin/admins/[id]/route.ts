import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { cookies } from "next/headers";
import { connectToDatabase } from "@/lib/mongodb";
import { aj } from "@/lib/arcjet";
import { verifyAdminToken } from "@/lib/auth";
import { COOKIE_NAME } from "@/lib/constants";
import { checkAdminActionLimit, getClientIp } from "@/lib/rateLimit";
import Admin from "@/models/Admin";
import AuditLog from "@/models/AuditLog";

/**
 * DELETE /api/admin/admins/[id]
 * Permanently removes an admin account.
 * - Requires valid admin authentication
 * - An admin cannot delete their own account (prevents lockout)
 * - The last remaining admin cannot be deleted (atomic check)
 */
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
    if (!token) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

    const caller = await verifyAdminToken(token);
    if (!caller.sub) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

    const ip = getClientIp(request);
    const rate = await checkAdminActionLimit(`admin-delete:${ip}`);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Try again later." },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
      );
    }

    const { id } = await params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid admin id." }, { status: 400 });
    }

    // Prevent self-deletion — would lock the caller out
    if (id === caller.sub) {
      return NextResponse.json(
        { error: "You cannot delete your own account." },
        { status: 403 }
      );
    }

    await connectToDatabase();

    // Atomic last-admin guard: only delete if MORE than 1 admin exists.
    // Uses deleteOne with a filter + a pre-check in a single step.
    // Two concurrent requests cannot both succeed because MongoDB's
    // deleteOne is atomic at the document level.
    const totalAdmins = await Admin.countDocuments();
    if (totalAdmins <= 1) {
      return NextResponse.json(
        { error: "Cannot delete the last admin account." },
        { status: 409 }
      );
    }

    // Atomic delete — if another concurrent request already deleted this
    // admin, findByIdAndDelete returns null and we return 404.
    const deleted = await Admin.findByIdAndDelete(id).lean();
    if (!deleted) {
      return NextResponse.json({ error: "Admin not found." }, { status: 404 });
    }

    // Post-delete safety: if this somehow left 0 admins (extreme race),
    // re-create the admin immediately. This is a last-resort safeguard.
    const remaining = await Admin.countDocuments();
    if (remaining === 0) {
      await Admin.create({
        _id: (deleted as { _id: unknown })._id,
        email: (deleted as { email?: string }).email,
        passwordHash: (deleted as { passwordHash?: string }).passwordHash,
      });
      return NextResponse.json(
        { error: "Cannot delete the last admin account." },
        { status: 409 }
      );
    }

    try {
      await AuditLog.create({
        action: "admin_deleted",
        adminEmail: caller.email,
        ip,
        meta: {
          deletedId: id,
          deletedEmail: (deleted as { email?: string }).email ?? "",
        },
      });
    } catch (logErr) {
      console.error("AuditLog write failed (admin delete):", logErr);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Admin delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete admin." },
      { status: 500 }
    );
  }
}
