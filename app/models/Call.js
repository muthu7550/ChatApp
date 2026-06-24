import mongoose from "mongoose";

const callSchema = new mongoose.Schema(
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
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    type: {
      type: String,
      enum: ["audio", "video"],
      required: true,
    },
    status: {
      type: String,
      enum: ["ringing", "accepted", "rejected", "missed", "ended", "cancelled"],
      default: "ringing",
    },
    startedAt: Date,
    endedAt: Date,
  },
  { timestamps: true }
);

export default mongoose.models.Call || mongoose.model("Call", callSchema);