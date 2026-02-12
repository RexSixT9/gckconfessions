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
  },
  { timestamps: true }
);

export default mongoose.models.Confession ||
  mongoose.model("Confession", ConfessionSchema);
