import { NextResponse } from "next/server";
import { dbConnect } from "../../../lib/db";
import Call from "../../../models/Call";

export async function PUT(req) {
  try {
    await dbConnect();

    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "userId required" },
        { status: 400 }
      );
    }

    await Call.updateMany(
      {
        members: userId,
        caller: { $ne: userId },
        status: "missed",
        missedSeenBy: { $ne: userId },
      },
      {
        $addToSet: {
          missedSeenBy: userId,
        },
      }
    );

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}