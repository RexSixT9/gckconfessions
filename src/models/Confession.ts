import mongoose, { Schema } from "mongoose";

const ConfessionSchema = new Schema(
  {
    message: { type: String, required: true, trim: true },
    messageHash: { type: String, index: true },
    music: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    posted: { type: Boolean, default: false },
    instagramPosted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

ConfessionSchema.index({ createdAt: -1 });
ConfessionSchema.index({ status: 1, createdAt: -1 });
ConfessionSchema.index({ posted: 1, createdAt: -1 });
ConfessionSchema.index({ instagramPosted: 1, createdAt: -1 });
ConfessionSchema.index({ messageHash: 1, createdAt: -1 });
ConfessionSchema.index(
  { message: "text", music: "text" },
  { name: "confession_text_search" }
);

export default mongoose.models.Confession ||
  mongoose.model("Confession", ConfessionSchema);
