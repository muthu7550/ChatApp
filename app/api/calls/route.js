import { NextResponse } from "next/server";
import dbConnect from "../../lib/dbConnect";
import Call from "../../models/Call";
import Conversation from "../../models/Conversation";

export async function POST(req) {
  try {
    await dbConnect();

    const { conversationId, callerId, type } = await req.json();

    const conversation = await Conversation.findById(conversationId).populate(
      "members",
      "_id name avatar"
    );

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const receiver = conversation.members.find(
      (member) => String(member._id) !== String(callerId)
    );

    const call = await Call.create({
      conversation: conversationId,
      caller: callerId,
      receiver: receiver?._id,
      members: conversation.members.map((m) => m._id),
      type,
      status: "ringing",
    });

    const populated = await Call.findById(call._id)
      .populate("caller", "name avatar")
      .populate("receiver", "name avatar")
      .populate("conversation");

    return NextResponse.json({ success: true, call: populated });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const mode = searchParams.get("mode");

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    if (mode === "ringing") {
      const call = await Call.findOne({
        members: userId,
        caller: { $ne: userId },
        status: "ringing",
      })
        .sort({ createdAt: -1 })
        .populate("caller", "name avatar")
        .populate("conversation");

      return NextResponse.json({ success: true, call });
    }

    const calls = await Call.find({ members: userId })
      .sort({ createdAt: -1 })
      .limit(60)
      .populate("caller", "name avatar")
      .populate("receiver", "name avatar")
      .populate("conversation");

    const missedCount = await Call.countDocuments({
      members: userId,
      caller: { $ne: userId },
      status: "missed",
    });

    return NextResponse.json({ success: true, calls, missedCount });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    await dbConnect();

    const { callId, status } = await req.json();

    const update = { status };

    if (status === "accepted") update.startedAt = new Date();
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}