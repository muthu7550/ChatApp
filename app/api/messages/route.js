import { NextResponse } from "next/server";
import { dbConnect } from "../../lib/db";
import Message from "../../models/Message";
import Conversation from "../../models/Conversation";

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