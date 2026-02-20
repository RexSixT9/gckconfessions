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
 * - The last remaining admin cannot be deleted
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

    // Prevent deleting the last admin — would lock everyone out
    const totalAdmins = await Admin.countDocuments();
    if (totalAdmins <= 1) {
      return NextResponse.json(
        { error: "Cannot delete the last admin account." },
        { status: 409 }
      );
    }

    const deleted = await Admin.findByIdAndDelete(id).lean();
    if (!deleted) {
      return NextResponse.json({ error: "Admin not found." }, { status: 404 });
    }

    await AuditLog.create({
      action: "admin_deleted",
      adminEmail: caller.email,
      ip,
      meta: {
        deletedId: id,
        deletedEmail: (deleted as { email?: string }).email ?? "",
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete admin." },
      { status: 500 }
    );
  }
}
