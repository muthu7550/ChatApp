import { NextResponse } from "next/server";
import { dbConnect } from "../../../lib/db";
import Conversation from "../../../models/Conversation";

export async function POST(req) {
  try {
    await dbConnect();

    const { conversationId, userId } = await req.json();

    if (!conversationId || !userId) {
      return NextResponse.json(
        { success: false, error: "conversationId and userId required" },
        { status: 400 }
      );
    }

    const conversation = await Conversation.findOneAndUpdate(
      {
        _id: conversationId,
        members: userId,
      },
      {
        $pull: { hiddenFor: userId },
      },
      { new: true }
    )
      .populate("members", "name email avatar")
      .populate("lastMessage");

    if (!conversation) {
      return NextResponse.json(
        { success: false, error: "Conversation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      conversation,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}