"use client";

import { useEffect, useRef } from "react";
import { playNotifySound, showBrowserNotification } from "../lib/notifyClient";

export default function IncomingMessageWatcher({ currentUser, onRefresh }) {
  const lastMessageIdRef = useRef(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!currentUser?._id) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/conversations?userId=${currentUser?._id}`
        );

        const result = await res.json();
        const conversations = result?.conversations || [];

        const latestConversation = conversations.find(
          (item) => item?.lastMessage?._id
        );

        const latestMessage = latestConversation?.lastMessage;

        if (!latestMessage?._id) return;

        // first polling: just remember latest message, don't notify
        if (!initializedRef.current) {
          initializedRef.current = true;
          lastMessageIdRef.current = latestMessage?._id;
          return;
        }

        const senderId =
          latestMessage?.sender?._id || latestMessage?.sender;

        const isNewMessage =
          latestMessage?._id !== lastMessageIdRef.current;

        const isOtherUserMessage =
          senderId !== currentUser?._id;

        if (isNewMessage && isOtherUserMessage) {
          lastMessageIdRef.current = latestMessage?._id;

          playNotifySound("message");

          showBrowserNotification({
            title: latestMessage?.sender?.name || "New message",
            body: latestMessage?.text || "Sent an attachment",
            icon: latestMessage?.sender?.avatar || "/default-avatar.png",
            url: `/chat?conversationId=${latestConversation?._id}`,
          });

          onRefresh?.();
          return;
        }

        lastMessageIdRef.current = latestMessage?._id;
      } catch (error) {
        console.error("Message polling error:", error);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [currentUser?._id, onRefresh]);

  return null;
}