import { NextResponse } from "next/server";
import { dbConnect } from "../../lib/db";
import User from "../../models/User";

export async function POST(req) {
  try {
    await dbConnect();

    const body = await req.json();

    console.log("SAVE FCM TOKEN BODY:", body);

    if (!body?.userId || !body?.token) {
      return NextResponse.json(
        { success: false, error: "userId and token required" },
        { status: 400 }
      );
    }

    const updatedUser = await User.findByIdAndUpdate(
      body.userId,
      {
        $set: {
          fcmTokens: [body.token],
        },
      },
      { returnDocument: "after" }
    ).select("name email fcmTokens");

    console.log("UPDATED USER FCM:", updatedUser);

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error("SAVE FCM TOKEN ERROR:", error);

    return NextResponse.json(
      { success: false, error: error?.message },
      { status: 500 }
    );
  }
}