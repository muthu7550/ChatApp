import mongoose from "mongoose";

const CallSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    caller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    callType: {
      type: String,
      enum: ["audio", "video"],
      required: true,
    },
    status: {
      type: String,
      enum: ["ringing", "accepted", "rejected", "missed", "ended"],
      default: "ringing",
    },
  },
  { timestamps: true }
);

delete mongoose.models.Call;

export default mongoose.model("Call", CallSchema);