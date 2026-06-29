import { NextResponse } from "next/server";
import { dbConnect } from "../../lib/db";
import Conversation from "../../models/Conversation";

export async function PATCH(req) {
  try {
    await dbConnect();

    const body = await req.json();

    const {
      conversationId,
      userId,
      action,
      targetUserId,
      targetUserIds = [],
      description,
      groupPrivacy,
      messagePermission,
      memberPermission,
      joinApproval,
    } = body;

    if (!conversationId || !userId || !action) {
      return NextResponse.json(
        { success: false, error: "conversationId, userId and action required" },
        { status: 400 }
      );
    }

    const group = await Conversation.findById(conversationId);

    if (!group || group.type !== "group") {
      return NextResponse.json(
        { success: false, error: "Group not found" },
        { status: 404 }
      );
    }

    const isAdmin = group.admins.some((id) => id.toString() === userId);

    const adminOnlyActions = [
      "add_member",
      "add_members",
      "remove_member",
      "promote_admin",
      "demote_admin",
      "update_description",
      "update_settings",
"approve_join_request",
"reject_join_request",
    ];

    if (adminOnlyActions.includes(action) && !isAdmin) {
      return NextResponse.json(
        { success: false, error: "Only admins can do this" },
        { status: 403 }
      );
    }

    if (action === "add_members") {
      if (!targetUserIds.length) {
        return NextResponse.json(
          { success: false, error: "targetUserIds required" },
          { status: 400 }
        );
      }

      const existingIds = group.members.map((id) => id.toString());

      targetUserIds.forEach((id) => {
        if (!existingIds.includes(id)) {
          group.members.push(id);
        }
      });
    }

    if (action === "add_member") {
      if (!targetUserId) {
        return NextResponse.json(
          { success: false, error: "targetUserId required" },
          { status: 400 }
        );
      }

      if (!group.members.some((id) => id.toString() === targetUserId)) {
        group.members.push(targetUserId);
      }
    }

    if (action === "remove_member") {
      group.members = group.members.filter(
        (id) => id.toString() !== targetUserId
      );
      group.admins = group.admins.filter(
        (id) => id.toString() !== targetUserId
      );
    }

    if (action === "promote_admin") {
      if (!group.admins.some((id) => id.toString() === targetUserId)) {
        group.admins.push(targetUserId);
      }
    }

    if (action === "demote_admin") {
      group.admins = group.admins.filter(
        (id) => id.toString() !== targetUserId
      );
    }

    if (action === "update_description") {
      group.description = description || "";
    }

    if (action === "update_settings") {
      if (groupPrivacy) group.groupPrivacy = groupPrivacy;
      if (messagePermission) group.messagePermission = messagePermission;
      if (memberPermission) group.memberPermission = memberPermission;
      if (typeof joinApproval === "boolean") group.joinApproval = joinApproval;
    }

    if (action === "leave_group") {
      group.members = group.members.filter((id) => id.toString() !== userId);
      group.admins = group.admins.filter((id) => id.toString() !== userId);

      if (group.members.length === 0) {
        await Conversation.findByIdAndDelete(conversationId);
        return NextResponse.json({ success: true });
      }

      if (group.admins.length === 0) {
        group.admins.push(group.members[0]);
      }
    }

    if (action === "mute_group") {
      if (!group.muteUsers.some((id) => id.toString() === userId)) {
        group.muteUsers.push(userId);
      }
    }

    if (action === "unmute_group") {
      group.muteUsers = group.muteUsers.filter(
        (id) => id.toString() !== userId
      );
    }

if (action === "generate_invite_link") {
  const inviteCode = `${conversationId}-${Date.now()}`;
  group.inviteLink = `${req.nextUrl.origin}/join-group?invite=${inviteCode}`;
}

if (action === "approve_join_request") {
  const request = group.joinRequests.find(
    (req) =>
      req.user?.toString() === targetUserId &&
      req.status === "pending"
  );

  if (!request) {
    return NextResponse.json(
      { success: false, error: "Join request not found" },
      { status: 404 }
    );
  }

  request.status = "approved";

  if (!group.members.some((id) => id.toString() === targetUserId)) {
    group.members.push(targetUserId);
  }

  group.hiddenFor = (group.hiddenFor || []).filter(
    (id) => id.toString() !== targetUserId
  );

  group.clearedFor = (group.clearedFor || []).filter(
    (item) => item?.user?.toString() !== targetUserId
  );
}

if (action === "reject_join_request") {
  const request = group.joinRequests.find(
    (req) =>
      req.user?.toString() === targetUserId &&
      req.status === "pending"
  );

  if (!request) {
    return NextResponse.json(
      { success: false, error: "Join request not found" },
      { status: 404 }
    );
  }

  request.status = "rejected";
}

    await group.save();

    const updatedGroup = await Conversation.findById(conversationId)
      .populate("members", "name email avatar about blockedUsers")
      .populate("admins", "name email avatar")
      .populate({
        path: "lastMessage",
        populate: { path: "sender", select: "name avatar" },
      });

    return NextResponse.json({
      success: true,
      conversation: updatedGroup,
    });
  } catch (error) {
    console.error("Group PATCH error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}