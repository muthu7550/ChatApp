import { NextResponse } from "next/server";
import { dbConnect } from "../../../lib/db";
import Conversation from "../../../models/Conversation";
import Call from "../../../models/Call";

export async function PATCH(req) {
  try {
    await dbConnect();

    const { conversationId, userId } = await req.json();

    if (!conversationId || !userId) {
      return NextResponse.json(
        { success: false, error: "conversationId and userId required" },
        { status: 400 }
      );
    }

    await Conversation.updateOne(
      { _id: conversationId, members: userId },
      {
        $pull: {
          clearedFor: { user: userId },
        },
      }
    );

    await Conversation.updateOne(
      { _id: conversationId, members: userId },
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
        $addToSet: {
          hiddenFor: userId,
        },
      }
    );

    return NextResponse.json({
      success: true,
      message: "Chat and calls cleared for you",
    });
  } catch (error) {
    console.error("Clear chat error:", error);

    return NextResponse.json(
      { success: false, error: error?.message || "Clear chat failed" },
      { status: 500 }
    );
  }
}