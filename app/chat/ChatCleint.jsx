"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import IncomingCallWatcher from "../components/IncomingCallWatcher";
import IncomingMessageWatcher from "../components/IncomingMessageWatcher";
import PushNotificationRegister from "../components/PushNotificationRegister";
import { requestNotificationPermission } from "../lib/notifyClient";

export default function ChatClient() {
  const searchParams = useSearchParams();

  const [currentUser, setCurrentUser] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    function setAppHeight() {
      const height = window.visualViewport?.height || window.innerHeight;
      document.documentElement.style.setProperty("--app-height", `${height}px`);
    }

    setAppHeight();
requestNotificationPermission();
    window.visualViewport?.addEventListener("resize", setAppHeight);
    window.visualViewport?.addEventListener("scroll", setAppHeight);
    window.addEventListener("resize", setAppHeight);

    document.body.classList.add("chat-page-lock");

    return () => {
      window.visualViewport?.removeEventListener("resize", setAppHeight);
      window.visualViewport?.removeEventListener("scroll", setAppHeight);
      window.removeEventListener("resize", setAppHeight);
      document.body.classList.remove("chat-page-lock");
    };
  }, []);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "null");

    if (!user?._id) {
      window.location.href = "/auth/login";
      return;
    }

    setCurrentUser(user);
    setPageLoading(false);
  }, []);

  useEffect(() => {
    const conversationId = searchParams.get("conversationId");
    if (conversationId) setMobileChatOpen(true);
  }, [searchParams]);

  if (pageLoading) {
    return (
      <main className="vh-100 d-flex align-items-center justify-content-center bg-light">
        Loading ChatterBox...
      </main>
    );
  }

  return (
    <main className="chat-page-layout">
      <style>{`
        html,
        body,
        .chat-page-lock {
          overflow: hidden !important;
          height: 100% !important;
        }

        .chat-page-layout {
          width: 100%;
          height: var(--app-height, 100dvh);
          max-height: var(--app-height, 100dvh);
          display: flex;
          overflow: hidden;
          background: #f8f9fa;
        }

        .chat-sidebar-panel {
          width: 360px;
          min-width: 360px;
          max-width: 360px;
          height: var(--app-height, 100dvh);
          overflow: hidden;
          background: #fff;
          border-right: 1px solid #e5e7eb;
        }

        .chat-window-panel {
          flex: 1;
          height: var(--app-height, 100dvh);
          min-width: 0;
          overflow: hidden;
          background: #fff;
        }

        .chat-window-shell {
          height: var(--app-height, 100dvh) !important;
          max-height: var(--app-height, 100dvh) !important;
          display: flex !important;
          flex-direction: column !important;
          overflow: hidden !important;
        }

        .chat-header {
          flex: 0 0 auto !important;
          position: sticky !important;
          top: 0 !important;
          z-index: 50 !important;
          background: #fff !important;
          min-height: 60px;
        }

        .chat-body {
          flex: 1 1 auto !important;
          min-height: 0 !important;
          overflow-y: auto !important;
          -webkit-overflow-scrolling: touch;
        }

        .chat-composer-wrap {
          flex: 0 0 auto !important;
          position: relative !important;
          z-index: 60 !important;
          background: #fff !important;
          border-top: 1px solid #eee;
          padding-bottom: max(env(safe-area-inset-bottom), 8px);
        }

        @media (max-width: 767px) {
          .chat-page-layout {
            display: block;
          }

          .chat-sidebar-panel {
            width: 100%;
            min-width: 100%;
            max-width: 100%;
            display: ${mobileChatOpen ? "none" : "block"};
          }

          .chat-window-panel {
            width: 100%;
            display: ${mobileChatOpen ? "block" : "none"};
          }
        }
      `}</style>

      {currentUser?._id && (
  <>
    <IncomingCallWatcher currentUser={currentUser} />
    <IncomingMessageWatcher
      currentUser={currentUser}
      onRefresh={() => setRefreshKey((prev) => prev + 1)}
    />
    <PushNotificationRegister currentUser={currentUser} />
  </>
)}

      <div className="chat-sidebar-panel">
        <Sidebar
          currentUser={currentUser}
          selectedConversation={selectedConversation}
          onSelectConversation={setSelectedConversation}
          refreshKey={refreshKey}
          onRefresh={() => setRefreshKey((prev) => prev + 1)}
          setMobileChatOpen={setMobileChatOpen}
        />
      </div>

      <div className="chat-window-panel">
        <ChatWindow
          currentUser={currentUser}
          conversation={selectedConversation}
          onBack={() => {
            setSelectedConversation(null);
            setMobileChatOpen(false);
            window.history.pushState(null, "", "/chat");
          }}
          onRefreshConversations={() => setRefreshKey((prev) => prev + 1)}
        />
      </div>
    </main>
  );
}
