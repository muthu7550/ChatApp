import { NextResponse } from "next/server";
import { dbConnect } from "../../../lib/db";
import Message from "../../../models/Message";

export async function DELETE(request, context) {
  const { id } = await context.params;

  console.log("ID:", id);

  const updated = await Message.findByIdAndUpdate(
    id,
    {
      deletedForEveryone: true,
      text: "This message was deleted",
      attachments: [],
      location: null,
    },
    { new: true }
  );

  return NextResponse.json({
    success: true,
    updated,
  });
}