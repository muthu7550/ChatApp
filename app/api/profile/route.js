import { NextResponse } from "next/server";
import { dbConnect } from "../../lib/db";
import User from "../../models/User";

export async function PUT(req) {
  try {
    await dbConnect();

    const body = await req.json();

    if (!body?.userId) {
      return NextResponse.json(
        { success: false, error: "User ID required" },
        { status: 400 }
      );
    }

    const user = await User.findByIdAndUpdate(
      body?.userId,
      {
        name: body?.name,
        about: body?.about,
        avatar: body?.avatar,
      },
      { new: true }
    ).select("-password");

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error?.message },
      { status: 500 }
    );
  }
}