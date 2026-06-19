import { NextResponse } from "next/server";
import { dbConnect } from "../../lib/db";
import Message from "../../models/Message";
import Conversation from "../../models/Conversation";
import User from "../../models/User";
import { sendPushToUsers } from "../../lib/sendPushNotification";

export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("conversationId");
    const userId = searchParams.get("userId");

const messages = await Message.find({
  conversation: conversationId,
  deletedFor: { $ne: userId },
})
  .populate("sender", "name avatar")
  .sort({ createdAt: 1 });  

    return NextResponse.json({
      success: true,
      messages,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error?.message },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    await dbConnect();

    const body = await req.json();

    const message = await Message.create({
      conversation: body?.conversationId,
      sender: body?.senderId,
      text: body?.text || "",
      attachments: body?.attachments || [],
      location: body?.location || null,
    });

    await Conversation.findByIdAndUpdate(body?.conversationId, {
      lastMessage: message?._id,
      updatedAt: new Date(),
    });

    const populatedMessage = await Message.findById(message?._id).populate(
      "sender",
      "name avatar"
    );

    const conversation = await Conversation.findById(body?.conversationId);

const receiverIds = conversation?.members
  ?.map((id) => id.toString())
  ?.filter((id) => id !== body?.senderId);

const sender = await User.findById(body?.senderId).select("name avatar");

await sendPushToUsers({
  userIds: receiverIds,
  title: sender?.name || "New message",
  body: body?.text || "Sent an attachment",
  icon: sender?.avatar || "/default-avatar.png",
  url: `/chat?conversationId=${body?.conversationId}`,
});

    return NextResponse.json({
      success: true,
      message: populatedMessage,
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
    const conversationId = searchParams.get("conversationId");

    await Message.deleteMany({
      conversation: conversationId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error?.message },
      { status: 500 }
    );
  }
}