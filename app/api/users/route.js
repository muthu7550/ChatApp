import { NextResponse } from "next/server";
import { dbConnect } from "../../lib/db";
import User from "../../models/User";

export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const currentUserId = searchParams.get("userId");
    const search = searchParams.get("search") || "";

    const users = await User.find({
      _id: { $ne: currentUserId },
      name: { $regex: search, $options: "i" },
    })
      .select("-password")
      .sort({ createdAt: -1 })
      .limit(20);

    return NextResponse.json({ success: true, users });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error?.message },
      { status: 500 }
    );
  }
}