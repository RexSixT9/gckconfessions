import mongoose, { Schema } from "mongoose";

const AuditLogSchema = new Schema(
  {
    action: { 
      type: String, 
      required: true,
      enum: [
        "admin_login",
        "admin_login_failed",
        "admin_logout",
        "admin_created",
        "confession_created",
        "confession_updated",
        "confession_deleted",
        "status_changed",
        "published",
        "unpublished",
      ],
      index: true,
    },
    adminEmail: { type: String, default: "", index: true },
    confessionId: { type: Schema.Types.ObjectId, ref: "Confession" },
    ip: { type: String, default: "", index: true },
    userAgent: { type: String },
    meta: { type: Schema.Types.Mixed, default: {} },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { 
    timestamps: true,
    // Auto-delete logs after 90 days for privacy
    expireAfterSeconds: 7776000,
  }
);

// Indexes for performance
AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });
AuditLogSchema.index({ ip: 1, createdAt: -1 });

export default mongoose.models.AuditLog ||
  mongoose.model("AuditLog", AuditLogSchema);
