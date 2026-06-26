import { NextResponse } from "next/server";
import dbConnect from "../../../../lib/dbConnect";
import Conversation from "../../../../models/Conversation";
import Message from "../../../../models/Message";

export async function DELETE(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const type = searchParams.get("type"); // direct or group

    if (!userId || !type) {
      return NextResponse.json(
        { success: false, error: "userId and type are required" },
        { status: 400 }
      );
    }

    if (!["direct", "group"].includes(type)) {
      return NextResponse.json(
        { success: false, error: "Invalid conversation type" },
        { status: 400 }
      );
    }

    const conversations = await Conversation.find({
      type,
      members: userId,
    }).select("_id");

    const conversationIds = conversations.map((c) => c._id);

    await Message.deleteMany({
      conversation: { $in: conversationIds },
    });

    await Conversation.deleteMany({
      _id: { $in: conversationIds },
    });

    return NextResponse.json({
      success: true,
      message: `${type} conversations cleared`,
    });
  } catch (error) {
    console.error("Clear conversations error:", error);
    return NextResponse.json(
      { success: false, error: "Clear conversations failed" },
      { status: 500 }
    );
  }
}