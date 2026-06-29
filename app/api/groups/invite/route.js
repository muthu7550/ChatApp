import { NextResponse } from "next/server";
import { dbConnect } from "../../../lib/db";
import Conversation from "../../../models/Conversation";
import User from "../../../models/User";
import { sendPushToUsers } from "../../../lib/sendPushNotification";

function getConversationIdFromInvite(invite = "") {
  return invite.split("-")[0];
}

export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const invite = searchParams.get("invite");
    const userId = searchParams.get("userId");

    if (!invite || !userId) {
      return NextResponse.json(
        { success: false, error: "invite and userId required" },
        { status: 400 }
      );
    }

    const pendingApproval = group.joinRequests?.some(
  (req) => req.user?._id?.toString() === userId && req.status === "pending"
);

return NextResponse.json({
  success: true,
  alreadyMember,
  pendingApproval,
  group: {
    _id: group._id,
    name: group.name,
    avatar: group.avatar || "",
    membersCount: group.members.length,
    joinApproval: group.joinApproval,
    alreadyMember,
    pendingApproval,
  },
});

    const conversationId = getConversationIdFromInvite(invite);

    const group = await Conversation.findOne({
      _id: conversationId,
      type: "group",
      inviteLink: { $regex: invite },
    }).populate("joinRequests.user", "name email avatar");

    if (!group) {
      return NextResponse.json(
        { success: false, error: "Invalid invite link" },
        { status: 404 }
      );
    }

    const alreadyMember = group.members.some(
      (id) => id.toString() === userId
    );

    return NextResponse.json({
      success: true,
      alreadyMember,
      pendingApproval,
      group: {
        _id: group._id,
        name: group.name,
        avatar: group.avatar || "",
        membersCount: group.members.length,
        joinApproval: group.joinApproval,
        alreadyMember,
        pendingApproval,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    await dbConnect();

    const { invite, userId } = await req.json();

    if (!invite || !userId) {
      return NextResponse.json(
        { success: false, error: "invite and userId required" },
        { status: 400 }
      );
    }

    if (group.joinApproval) {
  const alreadyRequested = group.joinRequests?.some(
    (req) => req.user?.toString() === userId && req.status === "pending"
  );

  if (!alreadyRequested) {
    group.joinRequests.push({
      user: userId,
      status: "pending",
      requestedAt: new Date(),
    });

    await group.save();

    const requestedUser = await User.findById(userId).select("name");

    await sendPushToUsers(group.admins, {
      title: "New group join request",
      body: `${requestedUser?.name || "Someone"} requested to join ${group.name}`,
    });
  }

  return NextResponse.json({
    success: true,
    pendingApproval: true,
    message: "Join request sent to admins",
    group,
  });
}

    const conversationId = getConversationIdFromInvite(invite);

    const group = await Conversation.findOne({
      _id: conversationId,
      type: "group",
      inviteLink: { $regex: invite },
    });

    if (!group) {
      return NextResponse.json(
        { success: false, error: "Invalid invite link" },
        { status: 404 }
      );
    }

    const alreadyMember = group.members.some(
      (id) => id.toString() === userId
    );

    if (alreadyMember) {
      return NextResponse.json({
        success: true,
        alreadyMember: true,
        group,
      });
    }

    if (group.joinApproval) {
      const alreadyRequested = group.joinRequests?.some(
        (req) =>
          req.user?.toString() === userId &&
          req.status === "pending"
      );

      if (!alreadyRequested) {
        group.joinRequests.push({
          user: userId,
          status: "pending",
          requestedAt: new Date(),
        });

        await group.save();

        const requestedUser = await User.findById(userId).select("name");

        try {
          await sendPushToUsers(group.admins, {
            title: "New group join request",
            body: `${requestedUser?.name || "Someone"} requested to join ${
              group.name || "your group"
            }`,
          });
        } catch (error) {
          console.error("JOIN REQUEST PUSH ERROR:", error);
        }
      }

      return NextResponse.json({
        success: true,
        pendingApproval: true,
        message: "Join request sent to admins",
        group,
      });
    }

    group.members.push(userId);

    group.hiddenFor = (group.hiddenFor || []).filter(
      (id) => id.toString() !== userId
    );

    group.clearedFor = (group.clearedFor || []).filter(
      (item) => item?.user?.toString() !== userId
    );

    await group.save();

    return NextResponse.json({
      success: true,
      group,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}