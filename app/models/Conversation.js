import mongoose from "mongoose";

const ConversationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["direct", "group"],
      default: "direct",
    },

    name: { type: String, trim: true },

    avatar: { type: String, default: "" },

    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    admins: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },

    hiddenFor: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    clearedFor: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        clearedAt: { type: Date, default: Date.now },
      },
    ],

    description: { type: String, default: "", trim: true },

    groupPrivacy: {
      type: String,
      enum: ["private", "public"],
      default: "private",
    },

    messagePermission: {
      type: String,
      enum: ["all", "admins"],
      default: "all",
    },

    memberPermission: {
      type: String,
      enum: ["all", "admins"],
      default: "admins",
    },

    joinApproval: {
      type: Boolean,
      default: false,
    },

    joinRequests: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        status: {
          type: String,
          enum: ["pending", "approved", "rejected"],
          default: "pending",
        },
        requestedAt: { type: Date, default: Date.now },
      },
    ],

    muteUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    pinnedMessages: [{ type: mongoose.Schema.Types.ObjectId, ref: "Message" }],

    inviteLink: {
      type: String,
      default: "",
    },
  },
  {
    createdBy: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
},
  },
  { timestamps: true }
);

export default mongoose.models.Conversation ||
  mongoose.model("Conversation", ConversationSchema);