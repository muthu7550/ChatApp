import { NextResponse } from "next/server";
import { dbConnect } from "../../lib/db";
import Call from "../../models/Call";
import Conversation from "../../models/Conversation";
import User from "../../models/User";
import { sendPushToUsers } from "../../lib/sendPushNotification";

export async function POST(req) {
  try {
    await dbConnect();

    const body = await req.json();

    if (!body?.conversationId || !body?.callerId || !body?.type) {
      return NextResponse.json(
        {
          success: false,
          error: "conversationId, callerId and type required",
        },
        { status: 400 }
      );
    }

    const call = await Call.create({
      conversation: body?.conversationId,
      caller: body?.callerId,
      callType: body?.type,
      status: "ringing",
    });

    const populatedCall = await Call.findById(call?._id).populate(
      "caller",
      "name avatar"
    );

    const conversation = await Conversation.findById(body?.conversationId);

const receiverIds = conversation?.members
  ?.map((id) => id.toString())
  ?.filter((id) => id !== body?.callerId);

const caller = await User.findById(body?.callerId).select("name avatar");

await sendPushToUsers({
  userIds: receiverIds,
  title: `Incoming ${body?.type} call`,
  body: `${caller?.name || "Someone"} is calling you`,
  icon: caller?.avatar || "/default-avatar.png",
  url: "/chat",
});

    return NextResponse.json({
      success: true,
      call: populatedCall,
    });
  } catch (error) {
    console.error("CALL CREATE ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Call create failed",
      },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    const conversations = await Conversation.find({
      members: userId,
    }).select("_id");

    const conversationIds = conversations.map((item) => item?._id);

    const call = await Call.findOne({
      conversation: { $in: conversationIds },
      caller: { $ne: userId },
      status: "ringing",
    })
      .populate("caller", "name avatar")
      .sort({ createdAt: -1 });

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

export async function PUT(req) {
  try {
    await dbConnect();

    const body = await req.json();

    const call = await Call.findByIdAndUpdate(
      body?.callId,
      { status: body?.status },
      { new: true }
    );

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