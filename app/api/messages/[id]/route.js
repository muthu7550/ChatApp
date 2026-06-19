export async function POST(req) {
  try {
    await dbConnect();

    const body = await req.json();

    console.log("MESSAGE BODY:", body);

    if (!body?.conversationId || !body?.senderId) {
      return NextResponse.json(
        {
          success: false,
          error: "conversationId and senderId required",
        },
        { status: 400 }
      );
    }

    const message = await Message.create({
      conversation: body.conversationId,
      sender: body.senderId,
      text: body.text || "",
      attachments: body.attachments || [],
      location: body.location || null,
    });

    await Conversation.findByIdAndUpdate(body.conversationId, {
      lastMessage: message._id,
      updatedAt: new Date(),
    });

    const populatedMessage = await Message.findById(message._id).populate(
      "sender",
      "name avatar"
    );

    return NextResponse.json({
      success: true,
      message: populatedMessage,
    });
  } catch (error) {
    console.error("MESSAGE API ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Message create failed",
      },
      { status: 500 }
    );
  }
}