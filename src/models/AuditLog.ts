import mongoose, { Schema } from "mongoose";
import { createCipheriv, createHash, randomBytes, scryptSync } from "crypto";

function getAuditKey() {
  const secret = process.env.AUDIT_LOG_ENCRYPTION_KEY || process.env.JWT_SECRET || "dev-audit-key";
  return scryptSync(secret, "gck-audit-salt", 32);
}

function encryptMeta(meta: unknown) {
  const iv = randomBytes(16);
  const cipher = createCipheriv("aes-256-cbc", getAuditKey(), iv);
  const payload = JSON.stringify(meta ?? {});
  const encrypted = Buffer.concat([cipher.update(payload, "utf8"), cipher.final()]).toString("base64");
  return { encrypted, iv: iv.toString("base64") };
}

const AuditLogSchema = new Schema(
  {
    action: { 
      type: String, 
      required: true,
      immutable: true,
      enum: [
        "admin_login",
        "admin_login_failed",
        "admin_logout",
        "admin_created",
        "admin_deleted",
        "confession_created",
        "confession_updated",
        "confession_deleted",
        "status_changed",
        "published",
        "unpublished",
      ],
      index: true,
    },
    adminEmail: { type: String, default: "", index: true, immutable: true },
    confessionId: { type: Schema.Types.ObjectId, ref: "Confession", immutable: true },
    ip: { type: String, default: "", index: true, immutable: true },
    userAgent: { type: String, immutable: true },
    meta: { type: Schema.Types.Mixed, default: {} },
    metaEncrypted: { type: String, default: "" },
    metaIv: { type: String, default: "" },
    checksum: { type: String, default: "", immutable: true, index: true },
  },
  { 
    timestamps: true,
  }
);

// Indexes for performance
AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });
AuditLogSchema.index({ ip: 1, createdAt: -1 });
// TTL index: auto-delete audit logs after 90 days for privacy
AuditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

AuditLogSchema.pre("save", function onSave(next) {
  if (this.isNew || this.isModified("meta")) {
    const { encrypted, iv } = encryptMeta(this.get("meta"));
    this.set("metaEncrypted", encrypted);
    this.set("metaIv", iv);
    this.set("meta", {});
  }

  if (this.isNew) {
    const raw = `${this.get("action")}|${this.get("adminEmail")}|${this.get("ip")}|${this.get("metaEncrypted")}|${this.get("createdAt")}`;
    const checksum = createHash("sha256").update(raw).digest("hex");
    this.set("checksum", checksum);
  }

  next();
});

function rejectMutation() {
  throw new Error("Audit logs are immutable and cannot be updated or deleted.");
}

AuditLogSchema.pre("updateOne", rejectMutation);
AuditLogSchema.pre("updateMany", rejectMutation);
AuditLogSchema.pre("findOneAndUpdate", rejectMutation);
AuditLogSchema.pre("deleteOne", rejectMutation);
AuditLogSchema.pre("deleteMany", rejectMutation);
AuditLogSchema.pre("findOneAndDelete", rejectMutation);

export default mongoose.models.AuditLog ||
  mongoose.model("AuditLog", AuditLogSchema);
