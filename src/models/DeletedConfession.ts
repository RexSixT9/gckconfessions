import mongoose, { Schema } from "mongoose";

const DeletedConfessionSchema = new Schema(
  {
    originalId: { type: String, required: true, index: true },
    message: { type: String, required: true },
    messageHash: { type: String },
    music: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
    },
    posted: { type: Boolean, default: false },
    originalCreatedAt: { type: Date },
    originalUpdatedAt: { type: Date },
    deletedBy: { type: String },
    deletedAt: { type: Date, default: Date.now },
    deleteReason: { type: String, default: "admin_delete" },
  },
  { timestamps: true }
);

DeletedConfessionSchema.index({ deletedAt: -1 });
DeletedConfessionSchema.index({ status: 1, deletedAt: -1 });

export default mongoose.models.DeletedConfession ||
  mongoose.model("DeletedConfession", DeletedConfessionSchema);
