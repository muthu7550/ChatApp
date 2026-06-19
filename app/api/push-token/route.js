import { NextResponse } from "next/server";
import { dbConnect } from "../../lib/db";
import User from "../../models/User";

export async function POST(req) {
  try {
    await dbConnect();

    const body = await req.json();

    if (!body?.userId || !body?.token) {
      return NextResponse.json(
        { success: false, error: "userId and token required" },
        { status: 400 }
      );
    }

    await User.findByIdAndUpdate(body.userId, {
      $addToSet: {
        fcmTokens: body.token,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error?.message },
      { status: 500 }
    );
  }
}