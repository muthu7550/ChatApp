import { NextResponse } from "next/server";
import { dbConnect } from "../../lib/db";
import Message from "../../models/Message";
import Conversation from "../../models/Conversation";

export const runtime = "nodejs";

export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("conversationId");
    const userId = searchParams.get("userId");

    if (!conversationId || !userId) {
      return NextResponse.json(
        { success: false, error: "conversationId and userId required" },
        { status: 400 }
      );
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      members: userId,
    }).select("clearedFor");

    if (!conversation) {
      return NextResponse.json({ success: true, messages: [] });
    }

    const clearedData = conversation.clearedFor?.find(
      (item) => item?.user?.toString() === userId
    );

    const messageQuery = { conversation: conversationId };

    if (clearedData?.clearedAt) {
      messageQuery.createdAt = { $gt: clearedData.clearedAt };
    }

    const messages = await Message.find(messageQuery)
      .populate("sender", "name avatar")
      .sort({ createdAt: 1 });

    return NextResponse.json({ success: true, messages });
  } catch (error) {
    console.error("GET messages error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Messages fetch failed" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    await dbConnect();

    const body = await req.json();
    const conversationId = body?.conversationId;
    const senderId = body?.senderId;

    if (!conversationId || !senderId) {
      return NextResponse.json(
        { success: false, error: "conversationId and senderId required" },
        { status: 400 }
      );
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      members: senderId,
    });

    if (!conversation) {
      return NextResponse.json(
        { success: false, error: "Conversation not found" },
        { status: 404 }
      );
    }

    if (conversation.type === "group") {
      const isAdmin =
        conversation.admins?.some((id) => id.toString() === senderId) || false;

      if (conversation.messagePermission === "admins" && !isAdmin) {
        return NextResponse.json(
          { success: false, error: "Only admins can send messages" },
          { status: 403 }
        );
      }
    }

    const message = await Message.create({
      conversation: conversationId,
      sender: senderId,
      text: body?.text || "",
      attachments: body?.attachments || [],
      location: body?.location || null,
      seenBy: [senderId],
    });

    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: message._id,
      updatedAt: new Date(),
      $pull: {
        hiddenFor: senderId,
      },
    });

    const populatedMessage = await Message.findById(message._id).populate(
      "sender",
      "name avatar"
    );

    // Push notification removed from this route because Firebase Admin import crashes Vercel.
    // Add push later through a separate API/background route.

    return NextResponse.json({
      success: true,
      message: populatedMessage,
    });
  } catch (error) {
    console.error("POST messages error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Message create failed" },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("conversationId");

    if (!conversationId) {
      return NextResponse.json(
        { success: false, error: "conversationId required" },
        { status: 400 }
      );
    }

    await Message.deleteMany({ conversation: conversationId });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE messages error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Messages delete failed" },
      { status: 500 }
    );
  }
}