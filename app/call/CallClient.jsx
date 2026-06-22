"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
} from "@livekit/components-react";
import "./call.css"
import "@livekit/components-styles";

export default function CallClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const room = searchParams.get("room");
  const type = searchParams.get("type");
  const callId = searchParams.get("callId");

  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);

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

      const res = await fetch("/api/livekit-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roomName: room,
          userId: storedUser?._id,
          name: storedUser?.name,
        }),
      });

      const result = await res.json().catch(() => null);

      if (!res.ok || !result?.success) {
        setError(result?.error || "Call token failed");
        return;
      }

      setToken(result?.token);
    }

    getToken();
  }, [room, router]);

  async function endCall() {
    if (callId) {
      await fetch("/api/calls", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          callId,
          status: "ended",
        }),
      });
    }

    router.push("/chat");
  }

  if (error) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <p>{error}</p>
      </main>
    );
  }

  if (!token) {
    return (
      <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
        <img
          src={
            user?.avatar || 
            `https://ui-avatars.com/api/?name=${encodeURIComponent(
              user?.name || "User"
            )}&background=00a884&color=fff`
          }
          className="w-28 h-28 rounded-full object-cover border-4 border-emerald-500 animate-pulse"
          alt="call dp"
        />

        <h1 className="text-3xl font-black mt-5">
          {type === "video" ? "Starting Video Call..." : "Starting Audio Call..."}
        </h1>

        <p className="text-zinc-400 mt-2">Connecting securely...</p>
      </main>
    );
  }

  return (
    <main className="h-screen bg-black">
      <LiveKitRoom
        token={token}
        serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
        connect={true}
        video={type === "video"}
        audio={true}
        onDisconnected={endCall}
        data-lk-theme="default"
        style={{ height: "100vh" }}
      >
        <VideoConference />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </main>
  );
}