import { NextResponse } from "next/server";
import { dbConnect } from "../../../lib/db";
import Call from "../../../models/Call";

export async function PATCH(req, { params }) {
  try {
    await dbConnect();

    const body = await req.json();
    const status = body?.status;

    if (!status) {
      return NextResponse.json(
        { success: false, error: "status required" },
        { status: 400 }
      );
    }

    const call = await Call.findByIdAndUpdate(
      params.id,
      { status },
      { new: true }
    ).populate("caller", "name avatar");

    return NextResponse.json({
      success: true,
      call,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error?.message },
      { status: 500 }
    );
  }
}