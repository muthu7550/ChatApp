"use client";

import { useEffect, useState } from "react";
import Composer from "./Composer";
import MessageBubble from "./MessageBubble";

export default function ChatShell() {
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);

  useEffect(() => {
    async function initConversation() {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      const userId = user?._id;

      if (!userId) return;
      const token = localStorage.getItem("token");

      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: {
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  },
        body: JSON.stringify({ userId }),
      });

      const result = await res.json();

      setConversationId(result?.data?._id);
      setMessages(result?.messages || []);
    }

    initConversation();
  }, []);

  async function sendMessage(payload) {
    if (!conversationId) return alert("Conversation not ready");

    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversationId,
        senderId: payload?.senderId,
        text: payload?.text,
        attachments: payload?.attachments || [],
        location: payload?.location || null,
      }),
    });

    const result = await res.json();

    if (result?.success) {
      setMessages((prev) => [...prev, result.data]);
    }
  }

  return (
    <div className="h-screen bg-zinc-950 text-dark flex">
      <aside className="w-80 border-r border-zinc-800 p-4 hidden md:block">
        <h1 className="text-2xl font-black">ChatterBox 😂</h1>

        <div className="mt-6">
          <button className="w-full rounded-xl bg-zinc-900 p-4 text-left">
            Public Chat Room
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col">
        <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-5">
          <div>
            <h2 className="font-bold">Public Chat Room</h2>
            <p className="text-xs text-emerald-400">online</p>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages?.map((msg) => (
            <MessageBubble key={msg?._id} message={msg} />
          ))}
        </section>

        <Composer onSend={sendMessage} />
      </main>
    </div>
  );
}       