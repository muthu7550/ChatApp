import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },

    firebaseUid: {
      type: String,
      unique: true,
      sparse: true,
    },

    password: {
      type: String,
    },

    avatar: String,

    about: {
      type: String,
      default: "Hey there! I am using ChatterBox Pro Max 😂",
    },

    isOnline: {
      type: Boolean,
      default: false,
    },

    lastSeen: Date,

    fcmTokens: [
      {
        type: String,
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", UserSchema);