"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Sidebar from "./Sidebar";
import ChatWindow from "./ChatWindow";
import IncomingCallWatcher from "./IncomingCallWatcher";
import { requestNotificationPermission } from "../lib/notifyClient";
import IncomingMessageWatcher from "./IncomingMessageWatcher";
import PushNotificationRegister from "./PushNotificationRegister";

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

      const res = await fetch(`/api/conversations?userId=${currentUser?._id}`);
      const result = await res.json();

      const matchedConversation = result?.conversations?.find(
        (item) => item?._id === urlConversationId,
      );

      if (matchedConversation) {
        setSelectedConversation(matchedConversation);
      }
    }

    loadConversationFromUrl();
  }, [urlConversationId, currentUser?._id]);

return (
  <div className="flex h-screen overflow-hidden">
    {currentUser?._id && (
      <>
      <IncomingCallWatcher currentUser={currentUser} />
         <IncomingMessageWatcher
      currentUser={currentUser}
      onRefresh={() => setRefreshKey((prev) => prev + 1)}
    />
    {currentUser?._id && (
  <PushNotificationRegister currentUser={currentUser} />
)}
      </>
      
    )}

    <div
      className={`
        w-full md:w-[380px]
        ${mobileChatOpen ? "hidden md:block" : "block"}
      `}
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
    </div>

    <div
      className={`
        flex-1
        ${mobileChatOpen ? "block" : "hidden md:block"}
      `}
    >
      <ChatWindow
        currentUser={currentUser}
        conversation={selectedConversation}
        onRefreshConversations={() =>
          setRefreshKey((prev) => prev + 1)
        }
        onBack={() => setMobileChatOpen(false)}
      />
    </div>
  </div>
);
}
