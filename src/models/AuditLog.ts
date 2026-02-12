import mongoose, { Schema } from "mongoose";

const AuditLogSchema = new Schema(
  {
    action: { type: String, required: true },
    adminEmail: { type: String, default: "" },
    ip: { type: String, default: "" },
    meta: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export default mongoose.models.AuditLog ||
  mongoose.model("AuditLog", AuditLogSchema);
