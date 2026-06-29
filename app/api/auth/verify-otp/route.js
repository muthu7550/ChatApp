import { NextResponse } from "next/server";
import { dbConnect } from "../../../lib/db";
import Otp from "../../../models/Otp";

export async function POST(req) {
  try {
    await dbConnect();

    const { email, otp } = await req.json();

    const record = await Otp.findOne({ email, otp });

    if (!record) {
      return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
    }

    if (record.expiresAt < new Date()) {
      await Otp.deleteMany({ email });
      return NextResponse.json({ error: "OTP expired" }, { status: 400 });
    }

    await Otp.deleteMany({ email });

    return NextResponse.json({
      success: true,
      message: "OTP verified",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "OTP verify failed" },
      { status: 500 }
    );
  }
}