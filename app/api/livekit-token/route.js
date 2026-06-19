import { NextResponse } from "next/server";
import { AccessToken } from "livekit-server-sdk";

export async function POST(req) {
  try {
    const { roomName, userId, name } = await req.json();

    if (!roomName || !userId) {
      return NextResponse.json(
        { success: false, error: "roomName and userId required" },
        { status: 400 }
      );
    }

    const token = new AccessToken(
      process.env.LIVEKIT_API_KEY,
      process.env.LIVEKIT_API_SECRET,
      {
        identity: userId,
        name: name || "User",
      }
    );

    token.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    return NextResponse.json({
      success: true,
      token: await token.toJwt(),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error?.message || "Token failed" },
      { status: 500 }
    );
  }
}