import { NextResponse } from "next/server";
import { dbConnect } from "../../../lib/db";
import Call from "../../../models/Call";

export async function DELETE(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "userId is required" },
        { status: 400 }
      );
    }

    await Call.updateMany(
      {
        members: userId,
      },
      {
        $addToSet: { hiddenFor: userId },
      }
    );

    return NextResponse.json({
      success: true,
      message: "Calls cleared for you",
    });
  } catch (error) {
    console.error("Clear calls error:", error);

    return NextResponse.json(
      { success: false, error: "Clear calls failed" },
      { status: 500 }
    );
  }
}