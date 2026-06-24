"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
} from "@livekit/components-react";
import "@livekit/components-styles";
import "./call.css";

export default function CallClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const room = searchParams.get("room");
  const type = searchParams.get("type");
  const callId = searchParams.get("callId");

  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [ending, setEnding] = useState(false);

  const backToChatUrl = room ? `/chat?conversationId=${room}` : "/chat";

  useEffect(() => {
    async function getToken() {
      const storedUser = JSON.parse(localStorage.getItem("user") || "null");
      setUser(storedUser);

      if (!storedUser?._id) {
        router.push("/login");
        return;
      }

      if (!room) {
        setError("Room ID missing");
        return;
      }

      const authToken = localStorage.getItem("token");

      const res = await fetch("/api/livekit-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authToken ? `Bearer ${authToken}` : "",
        },
        body: JSON.stringify({
          roomName: room,
          userId: storedUser._id,
          name: storedUser.name,
        }),
      });

      if (res.status === 401) {
        localStorage.clear();
        sessionStorage.setItem(
          "sessionMessage",
          "Your session has expired. Please login again.",
        );
        router.replace("/login");
        return;
      }

      const result = await res.json().catch(() => null);

      if (!res.ok || !result?.success) {
        setError(result?.error || "Call token failed");
        return;
      }

      setToken(result.token);
    }

    getToken();
  }, [room, router]);

  useEffect(() => {
    if (!callId) return;

    const interval = setInterval(async () => {
      const authToken = localStorage.getItem("token");

      const res = await fetch(`/api/calls?userId=${user?._id}`, {
        headers: {
          Authorization: authToken ? `Bearer ${authToken}` : "",
        },
      });

      const result = await res.json();

      const activeCall = result?.calls?.find((item) => item?._id === callId);

      if (activeCall?.status === "rejected") {
        setError("Call rejected");
        clearInterval(interval);
      }

      if (
        activeCall?.status === "ended" ||
        activeCall?.status === "cancelled"
      ) {
        router.replace(backToChatUrl);
        clearInterval(interval);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [callId, user?._id]);

  async function endCall() {
    if (ending) return;

    const authToken = localStorage.getItem("token");

    try {
      setEnding(true);

      if (callId) {
        await fetch("/api/calls", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: authToken ? `Bearer ${authToken}` : "",
          },
          body: JSON.stringify({
            callId,
            status: "ended",
          }),
        });
      }
    } finally {
      router.replace(backToChatUrl);
    }
  }

  if (error) {
    return (
      <main className="call-loading-page">
        <div className="call-error-card">
          <h2>Call Error</h2>
          <p>{error}</p>
          <button onClick={() => router.replace(backToChatUrl)}>
            Back to Chat
          </button>
        </div>
      </main>
    );
  }

  if (!token) {
    return (
      <main className="call-loading-page">
        <img
          src={
            user?.avatar ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(
              user?.name || "User",
            )}&background=00a884&color=fff`
          }
          className="call-loading-avatar"
          alt="call dp"
        />

        <h1>
          {type === "video"
            ? "Starting Video Call..."
            : "Starting Audio Call..."}
        </h1>

        <p>Connecting securely...</p>
      </main>
    );
  }

  return (
    <main className="call-page">
      <LiveKitRoom
        token={token}
        serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
        connect={true}
        video={type === "video"}
        audio={true}
        onDisconnected={endCall}
        data-lk-theme="default"
        className="call-livekit-room"
      >
        <VideoConference />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </main>
  );
}
