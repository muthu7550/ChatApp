import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { dbConnect } from "../../../lib/db";
import User from "../../../models/User";
import { createToken } from "../../../lib/jwt";

export async function POST(req) {
  try {
    await dbConnect();

    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password required" },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    if (!user.password) {
      return NextResponse.json(
        {
          error:
            "This account was created using Google/GitHub. Please login with social login.",
        },
        { status: 400 }
      );
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const token = await createToken({
      userId: user._id.toString(),
      email: user.email,
    });

    return NextResponse.json({
      message: "Login successfully",
      token,
      user: {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        avatar: user.avatar || "",
        about: user.about || "",
        blockedUsers: user.blockedUsers || [],
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Login failed" },
      { status: 500 }
    );
  }
}