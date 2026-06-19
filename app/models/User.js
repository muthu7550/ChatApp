import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    avatar: String,
    about: { type: String, default: "Hey there! I am using ChatterBox Pro Max 😂" },
    isOnline: { type: Boolean, default: false },
    lastSeen: Date,
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", UserSchema);