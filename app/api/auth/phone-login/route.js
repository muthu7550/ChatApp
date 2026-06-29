import { NextResponse } from "next/server";
import { dbConnect } from "../../../lib/db";
import User from "../../../models/User";
import { createToken } from "../../../lib/jwt";
import { getFirebaseAdminAuth } from "../../../lib/firebaseAdmin";

export async function POST(req) {
  try {
    await dbConnect();

    const { idToken, name } = await req.json();

    if (!idToken) {
      return NextResponse.json(
        { error: "Firebase idToken required" },
        { status: 400 }
      );
    }

    const decoded = await getFirebaseAdminAuth().verifyIdToken(idToken);

    const phone = decoded?.phone_number;
    const firebaseUid = decoded?.uid;

    if (!phone || !firebaseUid) {
      return NextResponse.json(
        { error: "Invalid phone verification" },
        { status: 401 }
      );
    }

    let user = await User.findOne({
      $or: [{ phone }, { firebaseUid }],
    });

    if (!user) {
      user = await User.create({
        name: name || `User ${phone.slice(-4)}`,
        phone,
        firebaseUid,
        avatar: "",
      });
    }

    const token = await createToken({
      userId: user._id.toString(),
      phone: user.phone,
    });

    return NextResponse.json({
      message: "Phone login successfully",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email || "",
        phone: user.phone || "",
        avatar: user.avatar || "",
        about: user.about || "",
      },
    });
  } catch (error) {
    console.error("PHONE LOGIN ERROR:", error);

    return NextResponse.json(
      { error: error?.message || "Phone login failed" },
      { status: 500 }
    );
  }
}