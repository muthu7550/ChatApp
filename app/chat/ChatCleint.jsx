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
        .chat-page-layout {
          width: 100%;
          height: 100vh;
          display: flex;
          overflow: hidden;
          background: #f8f9fa;
        }

        .chat-sidebar-panel {
          width: 360px;
          min-width: 360px;
          max-width: 360px;
          height: 100vh;
          background: #fff;
          border-right: 1px solid #e5e7eb;
        }

        .chat-window-panel {
          flex: 1;
          height: 100vh;
          min-width: 0;
          background: #fff;
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