import { NextResponse } from "next/server";
import { dbConnect } from "../../lib/db";
import User from "../../models/User";

import Message from "../../models/Message";
import Conversation from "../../models/Conversation";
import Call from "../../models/Call";


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

export async function DELETE(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "User id required",
        },
        {
          status: 400,
        }
      );
    }

    await Message.deleteMany({
      sender: userId,
    });

    await Call.deleteMany({
      caller: userId,
    });

    await Conversation.updateMany(
      {},
      {
        $pull: {
          members: userId,
        },
      }
    );

    await Conversation.deleteMany({
      members: {
        $size: 0,
      },
    });

    await User.findByIdAndDelete(userId);

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message,
      },
      {
        status: 500,
      }
    );
  }
}