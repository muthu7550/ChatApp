"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";

export default function ChatClient() {
  const searchParams = useSearchParams();

  const [currentUser, setCurrentUser] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [pageLoading, setPageLoading] = useState(true);

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

    if (conversationId) {
      setMobileChatOpen(true);
    }
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
        body {
          height: 100%;
          overflow: hidden;
        }

        .chat-page-layout {
          width: 100%;
          height: 100dvh;
          max-height: 100dvh;
          display: flex;
          overflow: hidden;
          background: #f8f9fa;
        }

        .chat-sidebar-panel {
          width: 360px;
          min-width: 360px;
          max-width: 360px;
          height: 100dvh;
          overflow: hidden;
          background: #ffffff;
          border-right: 1px solid #e5e7eb;
        }

        .chat-window-panel {
          flex: 1;
          height: 100dvh;
          min-width: 0;
          overflow: hidden;
          background: #ffffff;
        }

        .chat-window-shell {
          height: 100dvh !important;
          max-height: 100dvh !important;
          display: flex !important;
          flex-direction: column !important;
          overflow: hidden !important;
        }

        .chat-header {
          flex: 0 0 auto;
          min-height: 64px;
        }

        .chat-body {
          flex: 1 1 auto;
          min-height: 0 !important;
          overflow-y: auto !important;
          -webkit-overflow-scrolling: touch;
          padding-bottom: 8px;
        }

        .chat-composer-wrap {
          flex: 0 0 auto;
          position: sticky;
          bottom: 0;
          z-index: 20;
          background: #ffffff;
          padding-bottom: env(safe-area-inset-bottom);
          border-top: 1px solid #f1f1f1;
        }

        @media (max-width: 767px) {
          .chat-page-layout {
            display: block;
            height: 100dvh;
            max-height: 100dvh;
          }

          .chat-sidebar-panel {
            width: 100%;
            min-width: 100%;
            max-width: 100%;
            height: 100dvh;
            display: ${mobileChatOpen ? "none" : "block"};
          }

          .chat-window-panel {
            width: 100%;
            height: 100dvh;
            display: ${mobileChatOpen ? "block" : "none"};
          }

          .chat-window-shell {
            height: 100dvh !important;
          }

          .chat-header {
            min-height: 58px;
          }

          .chat-composer-wrap {
            padding-bottom: max(env(safe-area-inset-bottom), 8px);
          }
        }
      `}</style>

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
            setMobileChatOpen(false);
            window.history.pushState(null, "", "/chat");
          }}
          onRefreshConversations={() => setRefreshKey((prev) => prev + 1)}
        />
      </div>
    </main>
  );
}