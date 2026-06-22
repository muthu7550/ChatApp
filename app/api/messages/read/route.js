import { NextResponse } from "next/server";
import { dbConnect } from "../../../lib/db";
import Message from "../../../models/Message";

export async function POST(req) {
  try {
    await dbConnect();

    const body = await req.json();

    if (!body?.conversationId || !body?.userId) {
      return NextResponse.json(
        { success: false, error: "conversationId and userId required" },
        { status: 400 }
      );
    }

    await Message.updateMany(
      {
        conversation: body.conversationId,
        sender: { $ne: body.userId },
        seenBy: { $ne: body.userId },
      },
      {
        $addToSet: {
          seenBy: body.userId,
        },
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error?.message },
      { status: 500 }
    );
  }
}