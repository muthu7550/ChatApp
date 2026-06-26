"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FaArrowLeft,
  FaPhoneAlt,
  FaVideo,
  FaCommentDots,
  FaPhoneSlash,
} from "react-icons/fa";

import Composer from "./Composer";
import MessageBubble from "./MessageBubble";
import { ChatAvatar } from "./Avatar";


export default function ChatWindow({
  currentUser,
  conversation,
  onRefreshConversations,
  onBack,
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const conversationIdFromUrl = searchParams.get("conversationId");

  const chatBodyRef = useRef(null);
  const messageListRef = useRef(null);
  const loadedConversationRef = useRef(null);
  const fetchingMessagesRef = useRef(false);
  const pendingMessagesRef = useRef([]);
  const bottomLockTimerRef = useRef(null);

  const [activeConversation, setActiveConversation] = useState(conversation || null);
  const [isHydratingConversation, setIsHydratingConversation] = useState(false);
const [messages, setMessages] = useState([]);
const [chatCalls, setChatCalls] = useState([]);
  const [initialChatLoading, setInitialChatLoading] = useState(false);
  const [showRealChat, setShowRealChat] = useState(false);
  const [isPreparingReveal, setIsPreparingReveal] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const authHeaders = {
    Authorization: token ? `Bearer ${token}` : "",
  };

  useEffect(() => {
    if (conversation?._id) {
      setActiveConversation(conversation);
    }
  }, [conversation?._id]);

  useEffect(() => {
    if (!conversationIdFromUrl) {
      setActiveConversation(null);
setMessages([]);
setChatCalls([]);
setShowRealChat(false);
      setIsPreparingReveal(false);
      loadedConversationRef.current = null;
      pendingMessagesRef.current = [];
      return;
    }

    if (!currentUser?._id) return;
    if (activeConversation?._id === conversationIdFromUrl) return;

    let cancelled = false;

    async function hydrateConversation() {
      try {
        setIsHydratingConversation(true);
        setShowRealChat(false);
        setIsPreparingReveal(false);

        const res = await fetch(
          `/api/conversations?userId=${currentUser._id}`,
          { headers: authHeaders }
        );

        if (!res.ok || cancelled) return;

        const result = await res.json();

        const found = result?.conversations?.find(
          (item) => item?._id === conversationIdFromUrl
        );

        if (found && !cancelled) {
          setActiveConversation(found);
        }
      } catch (error) {
        console.error("Hydrate conversation error:", error);
      } finally {
        if (!cancelled) setIsHydratingConversation(false);
      }
    }

    hydrateConversation();

    return () => {
      cancelled = true;
    };
  }, [conversationIdFromUrl, currentUser?._id]);

  useEffect(() => {
    if (!activeConversation?._id || !currentUser?._id) return;

    const isNewConversation =
      loadedConversationRef.current !== activeConversation._id;

    if (!isNewConversation) return;

    loadedConversationRef.current = activeConversation._id;
    pendingMessagesRef.current = [];

    setMessages([]);
    setShowRealChat(false);
    setIsPreparingReveal(false);
    setInitialChatLoading(true);

  fetchMessages(true);
fetchChatCalls();
  }, [activeConversation?._id, currentUser?._id]);

  useEffect(() => {
    if (!activeConversation?._id || !currentUser?._id) return;

    const interval = setInterval(() => {
      fetchMessages(false);
    }, 30000);

    return () => clearInterval(interval);
  }, [activeConversation?._id, currentUser?._id]);

  async function fetchMessages(initialLoad = false) {
    if (fetchingMessagesRef.current) return;
    if (!activeConversation?._id || !currentUser?._id) return;

    const conversationId = activeConversation._id;

    try {
      fetchingMessagesRef.current = true;

      const res = await fetch(
        `/api/messages?conversationId=${conversationId}&userId=${currentUser._id}`,
        { headers: authHeaders }
      );

      const result = await res.json();
      const nextMessages = result?.messages || [];

      if (loadedConversationRef.current !== conversationId) return;

      if (initialLoad) {
        pendingMessagesRef.current = nextMessages;
      } else {
        setMessages(nextMessages);
        requestAnimationFrame(() => scrollToBottomHard());
      }
    } catch (error) {
      console.error("Fetch messages error:", error);
    } finally {
      fetchingMessagesRef.current = false;

      if (initialLoad && loadedConversationRef.current === conversationId) {
        setTimeout(() => {
          setMessages(pendingMessagesRef.current);
          setInitialChatLoading(false);
          setIsPreparingReveal(true);
        }, 180);
      }
    }
  }

  async function fetchChatCalls() {
  if (!activeConversation?._id || !currentUser?._id) return;

  try {
    const res = await fetch(
      `/api/calls?userId=${currentUser._id}&conversationId=${activeConversation._id}`,
      { headers: authHeaders }
    );

    const result = await res.json();
    setChatCalls(result?.calls || []);
  } catch (error) {
    console.error("Fetch chat calls error:", error);
    setChatCalls([]);
  }
}

  useLayoutEffect(() => {
    if (!isPreparingReveal) return;

    if (messages.length === 0) {
      setIsPreparingReveal(false);
      setShowRealChat(true);
      return;
    }

    requestAnimationFrame(() => {
      scrollToBottomHard();

      requestAnimationFrame(() => {
        scrollToBottomHard();

        setShowRealChat(true);
        setIsPreparingReveal(false);

        lockBottomForAWhile();
      });
    });
  }, [isPreparingReveal, messages.length]);

  useEffect(() => {
    if (!showRealChat) return;
    if (!chatBodyRef.current) return;

    const body = chatBodyRef.current;

    const observer = new ResizeObserver(() => {
      scrollToBottomHard();
    });

    observer.observe(body);

    if (messageListRef.current) {
      observer.observe(messageListRef.current);
    }

    return () => observer.disconnect();
  }, [showRealChat, activeConversation?._id]);

  function lockBottomForAWhile() {
    if (bottomLockTimerRef.current) {
      clearInterval(bottomLockTimerRef.current);
    }

    const start = Date.now();

    bottomLockTimerRef.current = setInterval(() => {
      scrollToBottomHard();

      if (Date.now() - start > 1200) {
        clearInterval(bottomLockTimerRef.current);
        bottomLockTimerRef.current = null;
      }
    }, 80);
  }

  function scrollToBottomHard() {
    const body = chatBodyRef.current;
    if (!body) return;

    body.scrollTop = body.scrollHeight;
  }

  async function sendMessage(payload = {}) {
    const token = localStorage.getItem("token");

    try {
      if (!activeConversation?._id) {
        alert("Select chat first");
        return;
      }

      if (!currentUser?._id) {
        alert("Login again");
        return;
      }

      const messagePayload = {
        conversationId: activeConversation._id,
        senderId: currentUser._id,
        text: payload?.text || "",
        attachments: payload?.attachments || [],
        location: payload?.location || null,
      };

      const res = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(messagePayload),
      });

      if (res.status === 401) {
        localStorage.clear();
        localStorage.setItem(
          "sessionMessage",
          "Your session has expired. Please login again."
        );
        router.push("/auth/login");
        return;
      }

      const result = await res.json().catch(() => null);

      if (!res.ok || !result?.success) {
        alert(result?.error || "Message send failed");
        return;
      }

      setMessages((prev) => [...prev, result.message]);
      setShowRealChat(true);
      onRefreshConversations?.();

      setTimeout(() => {
        scrollToBottomHard();
        lockBottomForAWhile();
      }, 30);
    } catch (error) {
      console.error("Send message error:", error);
      alert("Message send failed");
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
      {
        method: "DELETE",
        headers: authHeaders,
      }
    );

    const result = await res.json();

    if (result?.success) {
      fetchMessages(false);
    }
  }

  async function startCall(type) {
    if (!activeConversation?._id) {
      alert("Select chat first");
      return;
    }

    const res = await fetch("/api/calls", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      body: JSON.stringify({
        conversationId: activeConversation._id,
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
      `/call?room=${activeConversation._id}&type=${type}&callId=${result?.call?._id}`
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
    if (activeConversation?.type === "group") {
      return activeConversation?.name || "Group";
    }

    const receiver = activeConversation?.members?.find(
      (member) => member?._id !== currentUser?._id
    );

    return receiver?.name || "User";
  }

const chatTimeline = [
  ...messages.map((item) => ({
    type: "message",
    createdAt: item?.createdAt,
    data: item,
  })),
  ...chatCalls.map((item) => ({
    type: "call",
    createdAt: item?.createdAt,
    data: item,
  })),
].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

const loadingChat =
    isHydratingConversation ||
    initialChatLoading ||
    isPreparingReveal ||
    !showRealChat;
    

  function renderHeader() {
    return (
      <header className="chat-header d-flex align-items-center justify-content-between px-2 px-sm-3">
        <div className="d-flex align-items-center min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="btn btn-sm rounded-circle d-md-none me-2"
            title="Back"
          >
            <FaArrowLeft />
          </button>

          {activeConversation?._id && showRealChat ? (
            <ChatAvatar
              conversation={activeConversation}
              currentUser={currentUser}
              size={44}
            />
          ) : (
            <HeaderAvatarSkeleton />
          )}

          <div className="ms-2 ms-sm-3 min-w-0">
            {activeConversation?._id && showRealChat ? (
              <>
                <h6 className="mb-0 text-dark fw-bold text-truncate">
                  {getChatTitle()}
                </h6>
                <small className="text-secondary">
                  {activeConversation?.type === "group"
                    ? "Group chat"
                    : "Private chat"}
                </small>
              </>
            ) : (
              <HeaderTextSkeleton />
            )}
          </div>
        </div>

        {activeConversation?._id && showRealChat && (
          <div className="d-flex align-items-center gap-1 gap-sm-2">
            <button
              type="button"
              onClick={() => startCall("audio")}
              className="btn btn-sm rounded-circle chat-icon-btn text-white border-0"
              style={{
                background: "linear-gradient(135deg, #ff9d2e, #ff5b2f)",
              }}
            >
              <FaPhoneAlt />
            </button>

            <button
              type="button"
              onClick={() => startCall("video")}
              className="btn btn-sm rounded-circle chat-icon-btn text-white border-0"
              style={{
                background: "linear-gradient(135deg, #ff9d2e, #ff5b2f)",
              }}
            >
              <FaVideo />
            </button>
          </div>
        )}
      </header>
    );
  }

  if (
    !conversationIdFromUrl &&
    !activeConversation?._id &&
    !isHydratingConversation
  ) {
    return (
      <main className="chat-window-shell d-none d-md-flex align-items-center justify-content-center">
        <div className="text-center px-4">
          <div
            className="mx-auto mb-3 rounded-circle d-flex align-items-center justify-content-center text-white"
            style={{
              width: 90,
              height: 90,
              background: "linear-gradient(135deg, #ff9d2e, #ff5b2f)",
            }}
          >
            💬
          </div>

          <h1 className="fw-bold text-dark">ChatterBox Pro Max</h1>
          <p className="text-secondary mt-3">
            Select a chat, search your network, or create a group.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="chat-window-shell d-flex flex-column">
      <style>{`
        .chat-body {
          position: relative;
          overflow-anchor: none;
        }

        .call-chat-event-wrap {
  width: 100%;
  display: flex;
  justify-content: center;
  margin: 10px 0;
}

.call-chat-event {
  max-width: 78%;
  padding: 5px 11px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  line-height: 1.2;
  background: #f1f5f9;
  color: #64748b;
}

.call-chat-event.missed {
  background: #fee2e2;
  color: #dc2626;
}

.call-chat-event.rejected {
  background: #ffedd5;
  color: #ea580c;
}

.call-chat-event.accepted {
  background: #dcfce7;
  color: #16a34a;
}

.call-chat-event.ringing {
  background: #e0f2fe;
  color: #0284c7;
}


        .real-message-layer.hidden-before-reveal {
          visibility: hidden;
          pointer-events: none;
        }

        .chat-loading-cover {
          position: absolute;
          inset: 0;
          z-index: 5;
          background: #ffffff;
        }

        .real-message-layer {
          min-height: auto !important;
          padding-bottom: 8px !important;
        }

        .composer-hidden-but-space {
          visibility: hidden;
          pointer-events: none;
        }

        .chat-composer-wrap {
          flex: 0 0 auto;
          min-height: 76px;
        }

        .header-skeleton,
        .chat-message-enter {
          animation: chatReveal 0.18s ease-out both;
        }

        .skeleton-shimmer {
          background: linear-gradient(90deg,#fff3eb 25%,#ffd9c7 50%,#fff3eb 75%);
          background-size: 200% 100%;
          animation: chatShimmer 1.2s infinite;
        }

        @keyframes chatShimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        @keyframes chatReveal {
          from {
            opacity: 0;
            transform: translateY(6px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      {renderHeader()}

      <section
        ref={chatBodyRef}
        className="chat-body flex-grow-1 min-h-0 overflow-auto"
      >
   {chatTimeline.length > 0 && (
  <div
    ref={messageListRef}
    className={`real-message-layer chat-message-list chat-message-enter ${
      !showRealChat ? "hidden-before-reveal" : ""
    }`}
  >
    {chatTimeline.map((item) =>
      item.type === "call" ? (
        <CallChatEvent
          key={`call-${item.data?._id}`}
          call={item.data}
          currentUser={currentUser}
        />
      ) : (
        <MessageBubble
          key={item.data?._id}
          message={item.data}
          isOwnMessage={item.data?.sender?._id === currentUser?._id}
          onDeleteMessage={deleteMessage}
          onPreviewImage={setPreviewImage}
        />
      )
    )}
  </div>
)}

       {showRealChat && chatTimeline.length === 0 && (
          <EmptyChat onQuickMessage={sendQuickMessage} title={getChatTitle()} />
        )}

        {loadingChat && (
          <div className="chat-loading-cover">
            <PremiumChatSkeleton />
          </div>
        )}
      </section>

      {activeConversation?._id && (
        <div
          className={`chat-composer-wrap ${
            !showRealChat ? "composer-hidden-but-space" : ""
          }`}
        >
          <Composer onSend={sendMessage} currentUser={currentUser} />
        </div>
      )}

      {previewImage && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 bg-black bg-opacity-100 d-flex align-items-center justify-content-center"
          style={{ zIndex: 99999 }}
          onClick={() => setPreviewImage(null)}
        >
          <button
            className="btn btn-danger position-absolute top-0 end-0 m-3"
            onClick={() => setPreviewImage(null)}
          >
            ✕
          </button>

          <img
            src={previewImage}
            alt="preview"
            style={{
              maxWidth: "95%",
              maxHeight: "95%",
              objectFit: "contain",
            }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </main>
  );
}

function CallChatEvent({ call, currentUser }) {
  const isOutgoing = call?.caller?._id === currentUser?._id;
  const status = call?.status || "ringing";
  const callType = call?.type === "video" ? "video" : "audio";

  function formatCallTime(dateValue) {
    if (!dateValue) return "";

    return new Date(dateValue).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const callTime = formatCallTime(call?.createdAt);

  const getText = () => {
    if (status === "missed") {
      return `Missed ${callType} call`;
    }

    if (status === "rejected") {
      return isOutgoing
        ? `${callType} call declined`
        : `You declined ${callType} call`;
    }

    if (status === "accepted") {
      return isOutgoing
        ? `Outgoing ${callType} call`
        : `Incoming ${callType} call`;
    }

    return isOutgoing
      ? `Outgoing ${callType} call`
      : `Incoming ${callType} call`;
  };

  const Icon =
    status === "missed" || status === "rejected"
      ? FaPhoneSlash
      : status === "accepted"
        ? FaPhoneVolume
        : callType === "video"
          ? FaVideo
          : FaPhoneAlt;

  return (
    <div className="call-chat-event-wrap">
      <div className={`call-chat-event ${status}`}>
        <Icon size={11} />
        <span>{getText()}</span>

        {callTime && (
          <>
            <span className="call-event-dot">•</span>
            <span className="call-event-time">{callTime}</span>
          </>
        )}
      </div>
    </div>
  );
}

function HeaderAvatarSkeleton() {
  return (
    <div
      className="rounded-circle flex-shrink-0 skeleton-shimmer header-skeleton"
      style={{ width: 44, height: 44 }}
    />
  );
}

function HeaderTextSkeleton() {
  return (
    <div className="header-skeleton">
      <div
        className="rounded skeleton-shimmer mb-2"
        style={{ width: 140, height: 14 }}
      />
      <div
        className="rounded skeleton-shimmer"
        style={{ width: 90, height: 10 }}
      />
    </div>
  );
}

function PremiumChatSkeleton() {
  return (
    <div className="h-100 overflow-hidden p-3 p-sm-4">
      {[1, 2, 3, 4, 5, 6, 7].map((item) => (
        <div
          key={item}
          className={`d-flex mb-4 ${
            item % 2 === 0 ? "justify-content-end" : ""
          }`}
        >
          <div
            className="skeleton-shimmer"
            style={{
              width: item % 2 === 0 ? "220px" : "280px",
              maxWidth: "80%",
              height: item % 3 === 0 ? "90px" : "68px",
              borderRadius:
                item % 2 === 0 ? "22px 22px 6px 22px" : "22px 22px 22px 6px",
            }}
          />
        </div>
      ))}
    </div>
  );
}

function EmptyChat({ onQuickMessage, title }) {
  return (
    <div className="h-100 d-flex align-items-center justify-content-center text-center px-3">
      <div className="empty-chat-card bg-white shadow-lg border px-4 py-5 rounded-4">
        <div
          className="mx-auto mb-4 rounded-circle d-flex align-items-center justify-content-center text-white"
          style={{
            width: 86,
            height: 86,
            background: "linear-gradient(135deg, #ff9d2e, #ff5b2f)",
            fontSize: 34,
          }}
        >
          <FaCommentDots />
        </div>

        <h3 className="text-dark fw-bold mb-2">No Messages Yet</h3>

        <p className="text-secondary mb-4 mx-auto" style={{ maxWidth: 360 }}>
          Start a conversation with{" "}
          <span style={{ color: "#ff5b2f" }} className="fw-bold">
            {title}
          </span>
          .
        </p>

        <div className="d-flex flex-wrap justify-content-center gap-2">
          {["👋 Hello", "😊 How are you?", "🎉 Welcome"].map((message) => (
            <button
              key={message}
              type="button"
              onClick={() => onQuickMessage(message)}
              className="btn rounded-pill px-4 py-2 fw-semibold border-0"
              style={{
                background: "#fff3eb",
                color: "#ff5b2f",
              }}
            >
              {message}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}