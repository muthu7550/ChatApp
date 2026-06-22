import { NextResponse } from "next/server";
import { dbConnect } from "../../../lib/db";
import Message from "../../../models/Message";

export async function POST(req) {
  try {
    await dbConnect();

    const body = await req.json();

    console.log("MESSAGE BODY:", body);

    if (!body?.conversationId || !body?.senderId) {
      return NextResponse.json(
        {
          success: false,
          error: "conversationId and senderId required",
        },
        { status: 400 }
      );
    }

    const message = await Message.create({
      conversation: body.conversationId,
      sender: body.senderId,
      text: body.text || "",
      attachments: body.attachments || [],
      location: body.location || null,
        seenBy: [body?.senderId],
    });

    await Conversation.findByIdAndUpdate(body.conversationId, {
      lastMessage: message._id,
      updatedAt: new Date(),
    });

    const populatedMessage = await Message.findById(message._id).populate(
      "sender",
      "name avatar"
    );

    return NextResponse.json({
      success: true,
      message: populatedMessage,
    });
  } catch (error) {
    console.error("MESSAGE API ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Message create failed",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req, context) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);

    const userId = searchParams.get("userId");
    const type = searchParams.get("type"); // me / everyone
    const { id: messageId } = await context.params;

    if (!messageId) {
      return NextResponse.json(
        { success: false, error: "messageId required" },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "userId required" },
        { status: 400 }
      );
    }

    const message = await Message.findById(messageId);

    if (!message) {
      return NextResponse.json(
        { success: false, error: "Message not found" },
        { status: 404 }
      );
    }

    if (type === "everyone") {
      if (message.sender.toString() !== userId) {
        return NextResponse.json(
          { success: false, error: "You can delete only your own message" },
          { status: 403 }
        );
      }

      await Message.findByIdAndUpdate(messageId, {
        $set: {
          deletedForEveryone: true,
          text: "This message was deleted",
          attachments: [],
          location: null,
          editedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        type: "everyone",
      });
    }

    await Message.findByIdAndUpdate(messageId, {
      $addToSet: {
        deletedFor: userId,
      },
    });

    return NextResponse.json({
      success: true,
      type: "me",
    });
  } catch (error) {
    console.error("DELETE MESSAGE ERROR:", error);

    return NextResponse.json(
      { success: false, error: error?.message || "Delete failed" },
      { status: 500 }
    );
  }
}