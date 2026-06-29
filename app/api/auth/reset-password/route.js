import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { dbConnect } from "../../../lib/db";
import User from "../../../models/User";
import Otp from "../../../models/Otp";

export async function POST(req) {
  try {
    await dbConnect();

    const { email, otp, password } = await req.json();

    if (!email || !otp || !password) {
      return NextResponse.json(
        {
          success: false,
          error: "Email, OTP and password are required",
        },
        {
          status: 400,
        }
      );
    }

    const otpRecord = await Otp.findOne({
      email: email.toLowerCase(),
      otp,
    });

    if (!otpRecord) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid OTP",
        },
        {
          status: 400,
        }
      );
    }

    if (otpRecord.expiresAt < new Date()) {
      await Otp.deleteMany({
        email: email.toLowerCase(),
      });

      return NextResponse.json(
        {
          success: false,
          error: "OTP expired",
        },
        {
          status: 400,
        }
      );
    }

    const user = await User.findOne({
      email: email.toLowerCase(),
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
        },
        {
          status: 404,
        }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user.password = hashedPassword;

    await user.save();

    await Otp.deleteMany({
      email: email.toLowerCase(),
    });

    return NextResponse.json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("RESET PASSWORD ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      {
        status: 500,
      }
    );
  }
}