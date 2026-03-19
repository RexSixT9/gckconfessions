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
