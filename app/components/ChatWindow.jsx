"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FaArrowLeft,
  FaPhoneAlt,
  FaVideo,
  FaCommentDots,
} from "react-icons/fa";

import Composer from "./Composer";
import MessageBubble from "./MessageBubble";

export default function ChatWindow({
  currentUser,
  conversation,
  onRefreshConversations,
  onBack,
}) {
  const router = useRouter();
  const bottomRef = useRef(null);
  const chatBodyRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    if (!conversation?._id || !currentUser?._id) return;
    fetchMessages(true);
  }, [conversation?._id, currentUser?._id]);

  useEffect(() => {
    scrollToBottom(false);
  }, [messages.length]);

  useEffect(() => {
    function handleResize() {
      setTimeout(() => {
        scrollToBottom(false);
      }, 250);
    }

    window.visualViewport?.addEventListener("resize", handleResize);
    window.addEventListener("resize", handleResize);

    return () => {
      window.visualViewport?.removeEventListener("resize", handleResize);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  function scrollToBottom(smooth = true) {
    bottomRef.current?.scrollIntoView({
      behavior: smooth ? "smooth" : "auto",
      block: "end",
    });
  }

  async function fetchMessages(shouldScroll = false) {
    try {
      setMessagesLoading(true);

      const res = await fetch(
        `/api/messages?conversationId=${conversation?._id}&userId=${currentUser?._id}`
      );

      const result = await res.json();
      setMessages(result?.messages || []);

      if (shouldScroll) {
        setTimeout(() => scrollToBottom(false), 100);
      }
    } catch (error) {
      console.error("Fetch messages error:", error);
    } finally {
      setMessagesLoading(false);
    }
  }

  async function deleteMessage(messageId, type = "me") {
    const ok = confirm(
      type === "everyone"
        ? "Delete this message for everyone?"
        : "Delete this message for me?"
    );

    if (!ok) return;

    const res = await fetch(
      `/api/messages/${messageId}?userId=${currentUser?._id}&type=${type}`,
      { method: "DELETE" }
    );

    const result = await res.json();

    if (result?.success) {
      fetchMessages(true);
    }
  }

  async function sendMessage(payload = {}) {
    try {
      if (!conversation?._id) {
        alert("Select chat first");
        return;
      }

      if (!currentUser?._id) {
        alert("Login again");
        return;
      }

      const messagePayload = {
        conversationId: conversation._id,
        senderId: currentUser._id,
        text: payload?.text || "",
        attachments: payload?.attachments || [],
        location: payload?.location || null,
      };

      const res = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messagePayload),
      });

      const result = await res.json().catch(() => null);

      if (!res.ok || !result?.success) {
        alert(result?.error || "Message send failed");
        return;
      }

      setMessages((prev) => [...prev, result.message]);
      onRefreshConversations?.();

      setTimeout(() => scrollToBottom(true), 80);
    } catch (error) {
      console.error("Send message error:", error);
      alert("Message send failed");
    }
  }

  async function startCall(type) {
    if (!conversation?._id) {
      alert("Select chat first");
      return;
    }

    if (!currentUser?._id) {
      alert("Login again");
      return;
    }

    const res = await fetch("/api/calls", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        conversationId: conversation?._id,
        callerId: currentUser?._id,
        type,
      }),
    });

    const result = await res.json().catch(() => null);

    if (!res.ok || !result?.success) {
      alert(result?.error || "Call create failed.");
      return;
    }

    router.push(
      `/call?room=${conversation?._id}&type=${type}&callId=${result?.call?._id}`
    );
  }

  async function sendQuickMessage(text) {
    await sendMessage({
      text,
      attachments: [],
      location: null,
    });
  }

  function getChatTitle() {
    if (conversation?.type === "group") return conversation?.name || "Group";

    const receiver = conversation?.members?.find(
      (member) => member?._id !== currentUser?._id
    );

    return receiver?.name || "User";
  }

  function getChatAvatar() {
    if (conversation?.type === "group") {
      return (
        conversation?.avatar ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(
          conversation?.name || "Group"
        )}&background=00a884&color=fff`
      );
    }

    const receiver = conversation?.members?.find(
      (member) => member?._id !== currentUser?._id
    );

    return (
      receiver?.avatar ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(
        receiver?.name || "User"
      )}&background=00a884&color=fff`
    );
  }

  useEffect(() => {
    if (!conversation?._id || !currentUser?._id) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/messages?conversationId=${conversation?._id}&userId=${currentUser?._id}`
        );

        const result = await res.json();
        setMessages(result?.messages || []);
      } catch (error) {
        console.error("Message polling error:", error);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [conversation?._id, currentUser?._id]);

  if (!conversation?._id) {
    return (
      <main className="chat-window-shell d-none d-md-flex align-items-center justify-content-center">
        <div className="text-center px-4">
          <div className="display-1 mb-3">💬</div>
          <h1 className="fw-black text-white">ChatterBox Pro Max 😂</h1>
          <p className="text-secondary mt-3">
            Select a chat, search your network, or create a group.
          </p>
        </div>
      </main>
    );
  }

  return (
<main className="chat-page-fixed">
      <header className="chat-header-fixed">
        <div className="d-flex align-items-center min-w-0 flex-grow-1">
          <button
            type="button"
            onClick={onBack}
            className="btn btn-sm btn-dark rounded-circle d-md-none me-2"
            title="Back"
          >
            <FaArrowLeft />
          </button>

          <img
            src={getChatAvatar()}
            className="rounded-circle object-fit-cover flex-shrink-0"
            width="42"
            height="42"
            alt="chat"
            onClick={() => setPreviewImage(getChatAvatar())}
          />

          <div className="ms-2 ms-sm-3 min-w-0">
            <h6 className="mb-0 text-white fw-bold text-truncate">
              {getChatTitle()}
            </h6>
            <small className="text-secondary">
              {conversation?.type === "group" ? "Group chat" : "Private chat"}
            </small>
          </div>
        </div>

        <div className="d-flex align-items-center gap-1 gap-sm-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => startCall("audio")}
            className="btn btn-sm btn-dark rounded-circle chat-icon-btn"
            title="Audio Call"
          >
            <FaPhoneAlt />
          </button>

          <button
            type="button"
            onClick={() => startCall("video")}
            className="btn btn-sm btn-success rounded-circle chat-icon-btn"
            title="Video Call"
          >
            <FaVideo />
          </button>
        </div>
      </header>

  <section className="chat-body-fixed">
    <div className="chat-message-list">
      {messages.map((message) => (
        <MessageBubble
          key={message?._id}
          message={message}
          isOwnMessage={message?.sender?._id === currentUser?._id}
          onDeleteMessage={deleteMessage}
          onPreviewImage={setPreviewImage}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  </section>

  <div className="chat-composer-fixed">
    <Composer
      onSend={sendMessage}
      currentUser={currentUser}
      onFocusInput={() => {
        setTimeout(() => {
          bottomRef.current?.scrollIntoView({ behavior: "auto" });
        }, 300);
      }}
    />
  </div>
</main>
  );
}

function MessageSkeleton() {
  return (
    <div className="p-3 p-sm-4">
      {[1, 2, 3, 4, 5].map((item) => (
        <div
          key={item}
          className={`d-flex mb-3 ${
            item % 2 === 0 ? "justify-content-end" : ""
          }`}
        >
          <div className="chat-skeleton-bubble">
            <div className="chat-skeleton-line w-75" />
            <div className="chat-skeleton-line w-50 mt-2" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyChat({ onQuickMessage, title }) {
  return (
    <div className="h-100 d-flex align-items-center justify-content-center text-center px-3">
      <div className="empty-chat-card">
        <div className="empty-chat-icon">
          <FaCommentDots />
        </div>

        <h3 className="text-white fw-bold mb-2">No Messages Yet</h3>

        <p className="text-secondary mb-4">
          Start a conversation with{" "}
          <span className="text-success fw-bold">{title}</span>.
        </p>

        <div className="d-flex flex-wrap justify-content-center gap-2">
          <button
            type="button"
            onClick={() => onQuickMessage("👋 Hello")}
            className="btn btn-dark rounded-pill px-3"
          >
            👋 Hello
          </button>

          <button
            type="button"
            onClick={() => onQuickMessage("😊 How are you?")}
            className="btn btn-dark rounded-pill px-3"
          >
            😊 How are you?
          </button>

          <button
            type="button"
            onClick={() => onQuickMessage("🎉 Welcome")}
            className="btn btn-dark rounded-pill px-3"
          >
            🎉 Welcome
          </button>
        </div>
      </div>
    </div>
  );
}