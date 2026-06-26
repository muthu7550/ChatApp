import mongoose from "mongoose";

const ConversationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["direct", "group"],
      default: "direct",
    },

    name: {
      type: String,
      trim: true,
    },

    avatar: {
      type: String,
      default: "",
    },

    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // Group admins
    admins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // Last message
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },

    // Hidden chat (Delete chat for me)
    hiddenFor: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // Clear chat timestamp
    clearedFor: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        clearedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Group About
    description: {
      type: String,
      default: "",
      trim: true,
    },

    // Public / Private
    groupPrivacy: {
      type: String,
      enum: ["private", "public"],
      default: "private",
    },

    // Who can send messages
    messagePermission: {
      type: String,
      enum: ["all", "admins"],
      default: "all",
    },

    // Who can add members
    memberPermission: {
      type: String,
      enum: ["all", "admins"],
      default: "admins",
    },

    // Join approval
    joinApproval: {
      type: Boolean,
      default: false,
    },

    // Muted users
    muteUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // Pinned messages
    pinnedMessages: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message",
      },
    ],

    // Invite link
    inviteLink: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Conversation ||
  mongoose.model("Conversation", ConversationSchema);