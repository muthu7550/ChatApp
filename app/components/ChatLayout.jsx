"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Sidebar from "./Sidebar";
import ChatWindow from "./ChatWindow";
import IncomingCallWatcher from "./IncomingCallWatcher";
import IncomingMessageWatcher from "./IncomingMessageWatcher";
import PushNotificationRegister from "./PushNotificationRegister";
import { requestNotificationPermission } from "../lib/notifyClient";

export default function ChatLayout() {
  const searchParams = useSearchParams();
  const urlConversationId = searchParams.get("conversationId");

  const [currentUser, setCurrentUser] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    const token = localStorage.getItem("token");

    if (!token || !user?._id) {
      document.cookie = "token=; path=/; max-age=0";
      window.location.href = "/login";
      return;
    }

    setCurrentUser(user);
    requestNotificationPermission();
  }, []);

  useEffect(() => {
    async function loadConversationFromUrl() {
      if (!urlConversationId || !currentUser?._id) return;

      const res = await fetch(`/api/conversations?userId=${currentUser._id}`);
      const result = await res.json();

      const matchedConversation = result?.conversations?.find(
        (item) => item?._id === urlConversationId
      );

      if (matchedConversation) {
        setSelectedConversation(matchedConversation);
        setMobileChatOpen(true);
      }
    }

    loadConversationFromUrl();
  }, [urlConversationId, currentUser?._id]);

  return (
    <div className="sunday-page">
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

      <div className="sunday-app-card">
        <div className="sunday-topbar">
          <div className="sunday-brand">
            <span className="sunday-logo">C</span>
            <span>Chatter Box</span>
          </div>

          <div className="sunday-search">
            <span>⌕</span>
            <input placeholder="Search..." />
          </div>
        </div>

        <div className="sunday-content">
          <aside
            className={`sunday-sidebar ${
              mobileChatOpen ? "d-none d-md-flex" : "d-flex"
            }`}
          >
            <Sidebar
              currentUser={currentUser}
              selectedConversation={selectedConversation}
              refreshKey={refreshKey}
              onRefresh={() => setRefreshKey((prev) => prev + 1)}
              setMobileChatOpen={setMobileChatOpen}
              onSelectConversation={(conversation) => {
                setSelectedConversation(conversation);
                setMobileChatOpen(true);
              }}
            />
          </aside>

          <main
            className={`sunday-chat ${
              mobileChatOpen ? "d-flex" : "d-none d-md-flex"
            }`}
          >
            <ChatWindow
              currentUser={currentUser}
              conversation={selectedConversation}
              onRefreshConversations={() =>
                setRefreshKey((prev) => prev + 1)
              }
              onBack={() => setMobileChatOpen(false)}
            />
          </main>
        </div>
      </div>
    </div>
  );
}