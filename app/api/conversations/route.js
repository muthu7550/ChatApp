import { NextResponse } from "next/server";
import { dbConnect } from "../../lib/db";
import Conversation from "../../models/Conversation";
import Message from "../../models/Message";
import Call from "../../models/Call";
import mongoose from "mongoose";

export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const selectedConversationId = searchParams.get("conversationId");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "userId required" },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { success: false, error: "Invalid userId" },
        { status: 400 }
      );
    }

    const conversations = await Conversation.find({
      members: userId,
      hiddenFor: { $ne: userId },
    })
      .sort({ updatedAt: -1 })
      .populate("members", "name email avatar about blockedUsers")
      .populate("admins", "name email avatar")
      .populate("joinRequests.user", "name email avatar");

    const conversationsWithPending = await Promise.all(
      conversations.map(async (conversation) => {
        const plainConversation = conversation.toObject();

        const clearedData = plainConversation.clearedFor?.find(
          (item) => item?.user?.toString() === userId.toString()
        );

        const lastMessageQuery = {
          conversation: plainConversation._id,
          deletedFor: { $ne: userId },
        };

        if (clearedData?.clearedAt) {
          lastMessageQuery.createdAt = { $gt: clearedData.clearedAt };
        }

        const visibleLastMessage = await Message.findOne(lastMessageQuery)
          .sort({ createdAt: -1 })
          .populate("sender", "name avatar");

        const unreadCount = await Message.countDocuments({
          conversation: plainConversation._id,
          sender: { $ne: userId },
          seenBy: { $ne: userId },
          deletedFor: { $ne: userId },
          ...(clearedData?.clearedAt
            ? { createdAt: { $gt: clearedData.clearedAt } }
            : {}),
        });

        plainConversation.lastMessage = visibleLastMessage;
        plainConversation.unreadCount = unreadCount;

        const isAdmin = plainConversation.admins?.some(
          (admin) =>
            admin?._id?.toString() === userId ||
            admin?.toString() === userId
        );

        const pendingJoinCount = isAdmin
          ? (plainConversation.joinRequests || []).filter(
              (req) => req.status === "pending"
            ).length
          : 0;

        let blockInfo = {
          isBlockedByMe: false,
          isBlockedByOther: false,
        };

        if (plainConversation.type === "direct") {
          const currentMember = plainConversation.members?.find(
            (member) => member?._id?.toString() === userId
          );

          const otherMember = plainConversation.members?.find(
            (member) => member?._id?.toString() !== userId
          );

          blockInfo = {
            isBlockedByMe:
              currentMember?.blockedUsers?.some(
                (id) => id?.toString() === otherMember?._id?.toString()
              ) || false,

            isBlockedByOther:
              otherMember?.blockedUsers?.some(
                (id) => id?.toString() === userId
              ) || false,
          };
        }

        return {
          ...plainConversation,
          pendingJoinCount,
          ...blockInfo,
        };
      })
    );

const visibleConversations = conversationsWithPending.filter((conversation) => {
  const isSelected =
    selectedConversationId === conversation?._id?.toString();

  if (isSelected) return true;

  if (conversation.type !== "direct") return true;

  if (conversation.lastMessage) return true;

  return conversation.createdBy?.toString() === userId.toString();
});

    return NextResponse.json({
      success: true,
      conversations: visibleConversations,
    });
  } catch (error) {
    console.error("GET conversations error:", error);

    return NextResponse.json(
      { success: false, error: error.message },
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

          await Conversation.updateOne(
    { _id: exists._id },
    {
      $pull: {
        hiddenFor: body?.currentUserId,
      },
      $set: {
        updatedAt: new Date(),
      },
    }
  );
        const populatedExists = await Conversation.findById(exists?._id)
         .populate("members", "name email avatar about isOnline lastSeen blockedUsers")
          .populate({
            path: "lastMessage",
            populate: {
              path: "sender",
              select: "name avatar",
            },
          })
          .populate("admins", "name email avatar");

        return NextResponse.json({
          success: true,
          conversation: populatedExists,
        });
      }

const conversation = await Conversation.create({
  type: "direct",
  members: [body?.currentUserId, body?.receiverId],
  createdBy: body?.currentUserId,
});

      const populatedConversation = await Conversation.findById(
        conversation?._id
      )
      .populate("members", "name email avatar about isOnline lastSeen blockedUsers")
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
       .populate("members", "name email avatar about isOnline lastSeen blockedUsers")
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

    const conversation = await Conversation.findOne({
      _id: conversationId,
      members: userId,
    });

    if (!conversation) {
      return NextResponse.json(
        { success: false, error: "Conversation not found" },
        { status: 404 }
      );
    }

    if (conversation.type === "group") {

    await Conversation.updateOne(
      { _id: conversationId },
      {
        $addToSet: { hiddenFor: userId },
        $pull: { clearedFor: { user: userId } },
      }
    );

    await Conversation.updateOne(
      { _id: conversationId },
      {
        $push: {
          clearedFor: {
            user: userId,
            clearedAt: new Date(),
          },
        },
      }
    );

    await Call.updateMany(
  {
    conversation: conversationId,
    members: userId,
  },
  {
    $addToSet: { hiddenFor: userId },
  }
);

    return NextResponse.json({
      success: true,
      message: "Chat deleted for you only",
    });
  }

  await Conversation.updateOne(
  { _id: conversationId },
  {
    $addToSet: { hiddenFor: userId },
    $pull: { clearedFor: { user: userId } },
  }
);

await Conversation.updateOne( 
  { _id: conversationId },
  {
    $push: {
      clearedFor: {
        user: userId,
        clearedAt: new Date(),
      },
    },
  }
);

return NextResponse.json({
  success: true,
  message: "Chat deleted for you only",
});


  } catch (error) {
    return NextResponse.json(
      { success: false, error: error?.message },
      { status: 500 }
    );
  }
}