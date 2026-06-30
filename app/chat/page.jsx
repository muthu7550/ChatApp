import { Suspense } from "react";
import ChatClient from "./ChatCleint";

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <main className="vh-100 d-flex align-items-center justify-content-center bg-light">
          Loading ChatterBox...
        </main>
      }
    >
      <ChatClient />
    </Suspense>
  );
}