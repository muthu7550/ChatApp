import { NextResponse } from "next/server";
import { dbConnect } from "../../lib/db";
import Call from "../../models/Call";
import Conversation from "../../models/Conversation";

export async function POST(req) {
  try {
    await dbConnect();

    const { conversationId, callerId, type } = await req.json();

    if (!conversationId || !callerId || !type) {
      return NextResponse.json(
        { success: false, error: "conversationId, callerId and type required" },
        { status: 400 }
      );
    }

    const conversation = await Conversation.findById(conversationId).populate(
      "members",
      "_id name avatar"
    );

    if (!conversation) {
      return NextResponse.json(
        { success: false, error: "Conversation not found" },
        { status: 404 }
      );
    }

    const receiver = conversation.members.find(
      (member) => member?._id?.toString() !== callerId?.toString()
    );

    const call = await Call.create({
      conversation: conversationId,
      caller: callerId,
      receiver: receiver?._id || null,
      members: conversation.members.map((member) => member._id),
      hiddenFor: [],
      type,
      status: "ringing",
    });

    await Conversation.findByIdAndUpdate(conversationId, {
      updatedAt: new Date(),
      $pull: {
        hiddenFor: { $in: conversation.members.map((member) => member._id) },
      },
    });

    const populated = await Call.findById(call._id)
      .populate("caller", "name avatar")
      .populate("receiver", "name avatar")
      .populate("conversation");

    return NextResponse.json({ success: true, call: populated });
  } catch (error) {
    console.error("Create call error:", error);

    return NextResponse.json(
      { success: false, error: error?.message || "Call create failed" },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);

    const userId = searchParams.get("userId");
    const mode = searchParams.get("mode");
    const callId = searchParams.get("callId");
    const conversationId = searchParams.get("conversationId");

    if (callId) {
      const call = await Call.findById(callId)
        .populate("caller", "name avatar")
        .populate("receiver", "name avatar")
        .populate("conversation");

      return NextResponse.json({ success: true, call });
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "userId required" },
        { status: 400 }
      );
    }

if (mode === "ringing") {
  const call = await Call.findOne({
    members: userId,
    caller: { $ne: userId },
    status: "ringing",
    hiddenFor: { $ne: userId },
  })
    .sort({ createdAt: -1 })
    .populate("caller", "name avatar")
    .populate("receiver", "name avatar")
    .populate("conversation");

  return NextResponse.json({ success: true, call });
}

    const callQuery = {
      members: userId,
      hiddenFor: { $ne: userId },
    };

    if (conversationId) {
      callQuery.conversation = conversationId;
    }

    const calls = await Call.find(callQuery)
      .sort({ createdAt: conversationId ? 1 : -1 })
      .limit(conversationId ? 200 : 60)
      .populate("caller", "name avatar")
      .populate("receiver", "name avatar")
      .populate("conversation");

    const missedCount = await Call.countDocuments({
      members: userId,
      caller: { $ne: userId },
      status: "missed",
      hiddenFor: { $ne: userId },
    });

    return NextResponse.json({
      success: true,
      calls,
      missedCount,
    });
  } catch (error) {
    console.error("Get calls error:", error);

    return NextResponse.json(
      { success: false, error: error?.message || "Calls fetch failed" },
      { status: 500 }
    );
  }
}

export async function PUT(req) {
  try {
    await dbConnect();

    const { callId, status } = await req.json();

    if (!callId || !status) {
      return NextResponse.json(
        { success: false, error: "callId and status required" },
        { status: 400 }
      );
    }

    const update = { status };

    if (status === "accepted") {
      update.startedAt = new Date();
    }

    if (["ended", "rejected", "missed", "cancelled"].includes(status)) {
      update.endedAt = new Date();
    }

    const call = await Call.findByIdAndUpdate(callId, update, {
      new: true,
    })
      .populate("caller", "name avatar")
      .populate("receiver", "name avatar")
      .populate("conversation");

    return NextResponse.json({ success: true, call });
  } catch (error) {
    console.error("Update call error:", error);

    return NextResponse.json(
      { success: false, error: error?.message || "Call update failed" },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const callId = searchParams.get("callId");
    const userId = searchParams.get("userId");

    if (!callId || !userId) {
      return NextResponse.json(
        { success: false, error: "callId and userId are required" },
        { status: 400 }
      );
    }

    const call = await Call.findOneAndUpdate(
      {
        _id: callId,
        members: userId,
      },
      {
        $addToSet: { hiddenFor: userId },
      },
      { new: true }
    );

    if (!call) {
      return NextResponse.json(
        { success: false, error: "Call not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Call deleted for you",
    });
  } catch (error) {
    console.error("Delete call error:", error);

    return NextResponse.json(
      { success: false, error: error?.message || "Delete call failed" },
      { status: 500 }
    );
  }
}