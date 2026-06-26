import { NextResponse } from "next/server";
import { dbConnect } from "../../../lib/db";
import User from "../../../models/User";

export async function POST(req) {
  try {
    await dbConnect();

    const { userId, targetUserId } = await req.json();

    if (!userId || !targetUserId) {
      return NextResponse.json(
        { success: false, error: "userId and targetUserId required" },
        { status: 400 }
      );
    }

    await User.findByIdAndUpdate(userId, {
      $addToSet: { blockedUsers: targetUserId },
    });

    return NextResponse.json({
      success: true,
      message: "Contact blocked",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const targetUserId = searchParams.get("targetUserId");

    if (!userId || !targetUserId) {
      return NextResponse.json(
        { success: false, error: "userId and targetUserId required" },
        { status: 400 }
      );
    }

    await User.findByIdAndUpdate(userId, {
      $pull: { blockedUsers: targetUserId },
    });

    return NextResponse.json({
      success: true,
      message: "Contact unblocked",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}