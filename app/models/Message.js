import mongoose from "mongoose";

const AttachmentSchema = new mongoose.Schema(
  {
    url: String,
    publicId: String,
    type: {
      type: String,
      enum: ["image", "video", "audio", "pdf", "doc", "file"],
    },
    name: String,
    size: Number,
    mimeType: String,
  },
  { _id: false }
);

const LocationSchema = new mongoose.Schema(
  {
    lat: Number,
    lng: Number,
    label: String,
    mapUrl: String,
  },
  { _id: false }
);

const MessageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    text: {
      type: String,
      default: "",
    },

    attachments: {
      type: [AttachmentSchema],
      default: [],
    },

    location: {
      type: LocationSchema,
      default: null,
    },

    status: {
      type: String,
      enum: ["sent", "delivered", "seen"],
      default: "sent",
    },

    deletedFor: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    deletedForEveryone: {
      type: Boolean,
      default: false,
    },

    editedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

delete mongoose.models.Message;

export default mongoose.model("Message", MessageSchema);