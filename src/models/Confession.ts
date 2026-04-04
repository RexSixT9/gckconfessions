import mongoose, { Schema } from "mongoose";

const ConfessionSchema = new Schema(
  {
    message: { type: String, required: true, trim: true },
    // Note: standalone index removed — covered by the compound index { messageHash, createdAt } below
    messageHash: { type: String },
    messageNormalizedHash: { type: String },
    sanitizationVersion: { type: String, default: "" },
    music: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    posted: { type: Boolean, default: false },
    submitterIpHash: { type: String, default: "", index: true },
    submitterFingerprint: { type: String, default: "", index: true },
    submitterUserAgent: { type: String, default: "" },
    submitterDeviceType: { type: String, default: "unknown", index: true },
    submitterBrowser: { type: String, default: "unknown" },
    submitterOs: { type: String, default: "unknown" },
    submitterModel: { type: String, default: "unknown" },
    submitterPlatform: { type: String, default: "unknown" },
    submitterSecChUa: { type: String, default: "" },
  },
  { timestamps: true }
);

ConfessionSchema.index({ createdAt: -1 });
ConfessionSchema.index({ status: 1, createdAt: -1 });
ConfessionSchema.index({ posted: 1, createdAt: -1 });
// Covers duplicate-detection query (messageHash + createdAt range)
ConfessionSchema.index({ messageHash: 1, createdAt: -1 });
// Covers near-duplicate detection query using normalized text hash + createdAt range
ConfessionSchema.index({ messageNormalizedHash: 1, createdAt: -1 });
// Covers common admin filter: status + posted together
ConfessionSchema.index({ status: 1, posted: 1, createdAt: -1 });
ConfessionSchema.index(
  { message: "text", music: "text" },
  { name: "confession_text_search" }
);

export default mongoose.models.Confession ||
  mongoose.model("Confession", ConfessionSchema);
