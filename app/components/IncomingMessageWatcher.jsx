"use client";

import { useEffect, useRef } from "react";
import { playNotifySound, showBrowserNotification } from "../lib/notifyClient";

export default function IncomingMessageWatcher({ currentUser, onRefresh }) {
  const lastMessageRef = useRef(null);

  useEffect(() => {
    if (!currentUser?._id) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/conversations?userId=${currentUser?._id}`);
        const result = await res.json();

        const conversations = result?.conversations || [];

        const latestConversation = conversations.find(
          (c) => c?.lastMessage?._id
        );

        const latestMessage = latestConversation?.lastMessage;

        if (
          latestMessage?._id &&
          lastMessageRef.current &&
          latestMessage?._id !== lastMessageRef.current &&
          latestMessage?.sender !== currentUser?._id &&
          latestMessage?.sender?._id !== currentUser?._id
        ) {
          playNotifySound("message");

          showBrowserNotification({
            title: latestMessage?.sender?.name || "New message",
            body: latestMessage?.text || "Sent an attachment",
            icon: latestMessage?.sender?.avatar || "/default-avatar.png",
            url: `/chat?conversationId=${latestConversation?._id}`,
          });

          onRefresh?.();
        }

        if (latestMessage?._id) {
          lastMessageRef.current = latestMessage?._id;
        }
      } catch (error) {
        console.error("Message polling error:", error);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [currentUser?._id]);

  return null;
}