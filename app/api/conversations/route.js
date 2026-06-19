import { NextResponse } from "next/server";
import { dbConnect } from "../../lib/db";
import Conversation from "../../models/Conversation";
import Message from "../../models/Message";

export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    const conversations = await Conversation.find({
      members: userId,
    })
      .populate("members", "name email avatar about isOnline lastSeen")
      .populate("lastMessage")
      .sort({ updatedAt: -1 })
      .lean();

    const conversationsWithCount = await Promise.all(
      conversations.map(async (conversation) => {
        const messagesCount = await Message.countDocuments({
          conversation: conversation?._id,
        });

        return {
          ...conversation,
          messagesCount,
        };
      })
    );

    return NextResponse.json({
      success: true,
      conversations: conversationsWithCount,
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

    if (body?.type === "direct") {
      const exists = await Conversation.findOne({
        type: "direct",
        members: {
          $all: [body?.currentUserId, body?.receiverId],
        },
      });

      if (exists) {
        const populatedExists = await Conversation.findById(exists?._id)
          .populate("members", "name email avatar about")
          .populate("admins", "name email avatar");

        return NextResponse.json({
          success: true,
          conversation: populatedExists,
        });
      }

      const conversation = await Conversation.create({
        type: "direct",
        members: [body?.currentUserId, body?.receiverId],
      });

      const populatedConversation = await Conversation.findById(
        conversation?._id
      )
        .populate("members", "name email avatar about")
        .populate("admins", "name email avatar");

      return NextResponse.json({
        success: true,
        conversation: populatedConversation,
      });
    }

    if (body?.type === "group") {
      const conversation = await Conversation.create({
        type: "group",
        name: body?.name,
        avatar: body?.avatar || "",
        members: body?.members,
        admins: [body?.currentUserId],
      });

      const populatedConversation = await Conversation.findById(
        conversation?._id
      )
        .populate("members", "name email avatar about")
        .populate("admins", "name email avatar");

      return NextResponse.json({
        success: true,
        conversation: populatedConversation,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: "Invalid conversation type",
      },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
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

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return NextResponse.json(
        { success: false, error: "Conversation not found" },
        { status: 404 }
      );
    }

    if (conversation.type === "group") {
      conversation.members = conversation.members.filter(
        (id) => id.toString() !== userId
      );

      await conversation.save();

      return NextResponse.json({
        success: true,
        message: "Group removed from your chat list",
      });
    }

    await Conversation.findByIdAndDelete(conversationId);

    return NextResponse.json({
      success: true,
      message: "Chat deleted",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error?.message },
      { status: 500 }
    );
  }
}