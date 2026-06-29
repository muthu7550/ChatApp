import { NextResponse } from "next/server";
import { dbConnect } from "../../../lib/db";
import Otp from "../../../models/Otp";
import { createTransporter, otpTemplate } from "../../../lib/mailer";

export async function POST(req) {
  try {
    await dbConnect();

    const { email, name } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await Otp.deleteMany({ email });

    await Otp.create({
      email,
      otp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    const transporter = createTransporter();

    await transporter.sendMail({
      from: process.env.MAIL_FROM,
      to: email,
      subject: "Your ChatterBox OTP",
      html: otpTemplate({ name, otp }),
    });

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.error("SEND OTP ERROR:", error);
    return NextResponse.json(
      { error: error.message || "OTP send failed" },
      { status: 500 }
    );
  }
}