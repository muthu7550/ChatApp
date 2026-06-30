import { Suspense } from "react";
import ChatClient from "./ChatCleint";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";

export default function ChatPage() {
  return (
    <Suspense
      fallback={
       <main className="sunday-page">
  <div className="sunday-app-card">
    <div className="sunday-topbar">
      <div className="sunday-brand">
        <span className="sunday-logo">C</span>
        ChatterBox
      </div>

      <div className="sunday-search">
        <span>🔍</span>
        <input placeholder="Search conversations..." />
      </div>
    </div>

    <div className="sunday-content">
      <div className="sunday-sidebar">
        <Sidebar />
      </div>

      <div className="sunday-chat">
        <ChatWindow />
      </div>
    </div>
  </div>
</main>
      }
    >
      <ChatClient />  
    </Suspense>
  );
}