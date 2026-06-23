"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Sidebar from "./Sidebar";
import ChatWindow from "./ChatWindow";
import IncomingCallWatcher from "./IncomingCallWatcher";
import IncomingMessageWatcher from "./IncomingMessageWatcher";
import PushNotificationRegister from "./PushNotificationRegister";
import { requestNotificationPermission } from "../lib/notifyClient";

export default function ChatLayout() {
  const router = useRouter();
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
      router.replace("/login");
      return;
    }

    setCurrentUser(user);
    requestNotificationPermission();
  }, [router]);

  const loadConversationFromUrl = useCallback(async () => {
    if (!urlConversationId || !currentUser?._id) {
      setSelectedConversation(null);
      setMobileChatOpen(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`/api/conversations?userId=${currentUser._id}`, {
        cache: "no-store",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      if (res.status === 401) {
        localStorage.clear();
        document.cookie = "token=; path=/; max-age=0";
        router.replace("/login");
        return;
      }

      const result = await res.json();

      const matchedConversation = result?.conversations?.find(
        (item) => item?._id === urlConversationId
      );

      if (matchedConversation) {
        setSelectedConversation(matchedConversation);
        setMobileChatOpen(true);
      } else {
        setSelectedConversation(null);
        setMobileChatOpen(false);
      }
    } catch (error) {
      console.error("Load conversation from URL error:", error);
    }
  }, [urlConversationId, currentUser?._id, router]);

  useEffect(() => {
    loadConversationFromUrl();
  }, [loadConversationFromUrl, refreshKey]);

  function handleSelectConversation(conversation) {
    if (!conversation?._id) return;

    setSelectedConversation(conversation);
    setMobileChatOpen(true);

    router.push(`/chat?conversationId=${conversation._id}`);
  }

  function handleBack() {
    setSelectedConversation(null);
    setMobileChatOpen(false);
    router.push("/chat");
  }

  function handleRefresh() {
    setRefreshKey((prev) => prev + 1);
    router.refresh();
  }

  return (
    <div className="sunday-page">
      {currentUser?._id && (
        <>
          <IncomingCallWatcher currentUser={currentUser} />
          <IncomingMessageWatcher
            currentUser={currentUser}
            onRefresh={handleRefresh}
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
              onRefresh={handleRefresh}
              setMobileChatOpen={setMobileChatOpen}
              onSelectConversation={handleSelectConversation}
            />
          </aside>

          <main
            className={`sunday-chat ${
              mobileChatOpen ? "d-flex" : "d-none d-md-flex"
            }`}
          >
            <ChatWindow
              key={selectedConversation?._id || "empty-chat"}
              currentUser={currentUser}
              conversation={selectedConversation}
              onRefreshConversations={handleRefresh}
              onBack={handleBack}
            />
          </main>
        </div>
      </div>
    </div>
  );
}