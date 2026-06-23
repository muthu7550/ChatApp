import { Suspense } from "react";
import ChatLayout from "../components/ChatLayout";

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#0b141a] text-dark flex items-center justify-center">
          Loading chat...
        </main>
      }
    >
      <ChatLayout />
    </Suspense>
  );
}