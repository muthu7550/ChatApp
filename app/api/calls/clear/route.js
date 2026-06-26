import { NextResponse } from "next/server";
import dbConnect from "../../../lib/dbConnect";
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

    await Call.deleteMany({
      $or: [{ caller: userId }, { receiver: userId }],
    });

    return NextResponse.json({
      success: true,
      message: "Calls cleared successfully",
    });
  } catch (error) {
    console.error("Clear calls error:", error);
    return NextResponse.json(
      { success: false, error: "Clear calls failed" },
      { status: 500 }
    );
  }
}