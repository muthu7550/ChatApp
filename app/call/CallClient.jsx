"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  ControlBar,
  ParticipantTile,
  useTracks,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import "@livekit/components-styles";
import "./call.css";

export default function CallClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const room = searchParams.get("room");
  const type = searchParams.get("type") || "audio";
  const callId = searchParams.get("callId");

  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [call, setCall] = useState(null);
  const [ending, setEnding] = useState(false);
  const [loadingText, setLoadingText] = useState("Calling...");

  const gettingTokenRef = useRef(false);
  const backToChatUrl = room ? `/chat?conversationId=${room}` : "/chat";

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "null");
    setUser(storedUser);

    if (!storedUser?._id) {
      router.replace("/auth/login");
      return;
    }

    if (!room || !callId) {
      setError("Call details missing");
    }
  }, [room, callId, router]);

  useEffect(() => {
    if (!callId || !user?._id) return;

    let cancelled = false;

    async function checkCallStatus() {
      try {
        const authToken = localStorage.getItem("token");

        const res = await fetch(`/api/calls?callId=${callId}`, {
          cache: "no-store",
          headers: {
            Authorization: authToken ? `Bearer ${authToken}` : "",
          },
        });

        const result = await res.json().catch(() => null);
        const latestCall = result?.call;

        if (cancelled || !latestCall?._id) return;

        setCall(latestCall);

        if (latestCall.status === "ringing") {
          setLoadingText("Ringing...");
          return;
        }

        if (latestCall.status === "accepted") {
          setLoadingText("Connecting...");
          await getLiveKitToken();
          return;
        }

        if (latestCall.status === "rejected") {
          setToken("");
          setError("Call rejected");
          return;
        }

        if (latestCall.status === "missed") {
          setToken("");
          setError("Call missed");
          return;
        }

        if (latestCall.status === "cancelled") {
          setToken("");
          setError("Call cancelled");
          return;
        }

        if (latestCall.status === "ended") {
          router.replace(backToChatUrl);
        }
      } catch (err) {
        console.warn("Call status skipped:", err?.message);
      }
    }

    checkCallStatus();
    const interval = setInterval(checkCallStatus, 1500);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [callId, user?._id]);

  async function getLiveKitToken() {
    if (token || gettingTokenRef.current) return;

    gettingTokenRef.current = true;

    try {
      const storedUser = JSON.parse(localStorage.getItem("user") || "null");
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

      const result = await res.json().catch(() => null);

      if (!res.ok || !result?.success) {
        setError(result?.error || "Call token failed");
        return;
      }

      setToken(result.token);
    } finally {
      gettingTokenRef.current = false;
    }
  }

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
            status: token ? "ended" : "cancelled",
          }),
        });
      }
    } finally {
      router.replace(backToChatUrl);
    }
  }

  async function callAgain() {
    setError("");
    setToken("");
    setLoadingText("Calling...");
    gettingTokenRef.current = false;

    const authToken = localStorage.getItem("token");
    const storedUser = JSON.parse(localStorage.getItem("user") || "null");

    const res = await fetch("/api/calls", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authToken ? `Bearer ${authToken}` : "",
      },
      body: JSON.stringify({
        conversationId: room,
        callerId: storedUser._id,
        type,
      }),
    });

    const result = await res.json().catch(() => null);

    if (!res.ok || !result?.success) {
      setError(result?.error || "Call again failed");
      return;
    }

    router.replace(
      `/call?room=${room}&type=${type}&callId=${result?.call?._id}`
    );
  }

  function getOtherPerson() {
    const callerId = call?.caller?._id || call?.caller;
    const isCaller = callerId === user?._id;
    return isCaller ? call?.receiver : call?.caller;
  }

  const otherPerson = getOtherPerson();

  if (error) {
    const isRejected = error.toLowerCase().includes("rejected");
    const isMissed = error.toLowerCase().includes("missed");
    const isCancelled = error.toLowerCase().includes("cancelled");

    return (
      <main className="call-loading-page">
        <CallStyle />

        <div className="call-ended-card">
          <div className="call-ended-icon danger">
            {isRejected ? "✕" : isMissed ? "⌛" : isCancelled ? "−" : "!"}
          </div>

          <h1>
            {isRejected
              ? "Call Rejected"
              : isMissed
              ? "Call Missed"
              : isCancelled
              ? "Call Cancelled"
              : "Unable to Connect"}
          </h1>

          <p>
            {isRejected
              ? "The person declined your call. You can try calling again."
              : isMissed
              ? "The person did not answer your call."
              : isCancelled
              ? "The call was cancelled before connecting."
              : error}
          </p>

          <div className="call-ended-actions">
            {(isRejected || isMissed || isCancelled) && (
              <button className="call-again-btn" onClick={callAgain}>
                Call Again
              </button>
            )}

            <button
              className="back-chat-btn"
              onClick={() => router.replace(backToChatUrl)}
            >
              Back to Chat
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!token) {
    return (
      <main className="call-loading-page">
        <CallStyle />

        <div className="outgoing-call-card">
          <div className="outgoing-avatar-ring">
            <img src={getAvatar(otherPerson, user)} alt="call dp" />
          </div>

          <div className="call-type-label">
            {type === "video" ? "Video Call" : "Audio Call"}
          </div>

          <h1>{otherPerson?.name || "Calling..."}</h1>
          <p>{loadingText}</p>

          <div className="ring-dots">
            <span />
            <span />
            <span />
          </div>

          <button
            type="button"
            className="cancel-call-btn"
            onClick={endCall}
            disabled={ending}
          >
            {ending ? "Ending..." : "Cancel Call"}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="call-page">
      <CallStyle />

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
        <CustomCallStage currentUser={user} otherPerson={otherPerson} type={type} />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </main>
  );
}

function CustomCallStage({ currentUser, otherPerson, type }) {
  const tracks = useTracks(
    [
      {
        source: Track.Source.Camera,
        withPlaceholder: true,
      },
    ],
    {
      onlySubscribed: false,
    }
  );

  return (
    <div className="custom-call-stage">
      <div className="call-grid">
        {tracks.map((trackRef) => {
          const participantId = trackRef?.participant?.identity;
          const isMe = participantId === currentUser?._id;
          const person = isMe ? currentUser : otherPerson;

          const hasVideo =
            trackRef?.publication &&
            trackRef?.publication?.isSubscribed &&
            !trackRef?.publication?.isMuted;

          return (
            <div key={participantId || Math.random()} className="custom-call-tile">
              {hasVideo ? (
                <ParticipantTile trackRef={trackRef} />
              ) : (
                <ProfilePlaceholder person={person} isSpeaking />
              )}

              <div className="custom-call-name">
                {person?.name || (isMe ? "You" : "User")}
              </div>
            </div>
          );
        })}
      </div>

      <div className="call-top-profile">
        <div className="mini-speaking-ring">
          <img src={getAvatar(otherPerson, currentUser)} alt="profile" />
        </div>

        <div>
          <strong>{otherPerson?.name || "On Call"}</strong>
          <span>{type === "video" ? "Video call ongoing" : "Audio call ongoing"}</span>
        </div>
      </div>

      <ControlBar />
    </div>
  );
}

function ProfilePlaceholder({ person, isSpeaking }) {
  return (
    <div className="profile-placeholder">
      <div className={isSpeaking ? "big-speaking-ring" : "big-profile-ring"}>
        <img src={getAvatar(person)} alt={person?.name || "User"} />
      </div>

      <h2>{person?.name || "User"}</h2>
      <p>Camera off</p>
    </div>
  );
}

function getAvatar(person, fallbackUser) {
  return (
    person?.avatar ||
    fallbackUser?.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      person?.name || fallbackUser?.name || "User"
    )}&background=ff6b2c&color=fff&bold=true`
  );
}

function CallStyle() {
  return (
    <style>{`
      .custom-call-stage {
        height: 100vh;
        width: 100%;
        background: #000;
        position: relative;
        overflow: hidden;
      }

      .call-grid {
        height: calc(100vh - 92px);
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
        gap: 8px;
        padding: 8px;
      }

      .custom-call-tile {
        position: relative;
        border-radius: 18px;
        overflow: hidden;
        background:
          radial-gradient(circle at center, rgba(255,91,47,.12), transparent 38%),
          #171717;
        min-height: 260px;
      }

      .custom-call-tile .lk-participant-tile {
        width: 100%;
        height: 100%;
        background: #111 !important;
      }

      .custom-call-name {
        position: absolute;
        left: 12px;
        bottom: 12px;
        z-index: 20;
        color: white;
        font-size: 13px;
        font-weight: 900;
        padding: 6px 10px;
        border-radius: 999px;
        background: rgba(0,0,0,.55);
      }

      .profile-placeholder {
        height: 100%;
        min-height: 260px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }

      .big-speaking-ring,
      .big-profile-ring {
        width: 170px;
        height: 170px;
        padding: 7px;
        border-radius: 999px;
        background: linear-gradient(135deg,#ff9d2e,#ff5b2f);
      }

      .big-speaking-ring {
        animation: speakingPulseBig 1.35s infinite;
      }

      .big-speaking-ring img,
      .big-profile-ring img,
      .mini-speaking-ring img,
      .outgoing-avatar-ring img {
        width: 100%;
        height: 100%;
        border-radius: 999px;
        object-fit: cover;
        border: 4px solid white;
      }

      .profile-placeholder h2 {
        color: white;
        font-weight: 900;
        margin: 18px 0 4px;
      }

      .profile-placeholder p {
        color: #a1a1aa;
        margin: 0;
      }

      .call-top-profile {
        position: fixed;
        top: 12px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 999999;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 14px 8px 8px;
        border-radius: 999px;
        background: rgba(0,0,0,.7);
        color: white;
        backdrop-filter: blur(12px);
      }

      .mini-speaking-ring {
        width: 48px;
        height: 48px;
        min-width: 48px;
        padding: 3px;
        border-radius: 999px;
        background: linear-gradient(135deg,#ff9d2e,#ff5b2f);
        animation: speakingPulse 1.2s infinite;
      }

      .call-top-profile strong,
      .call-top-profile span {
        display: block;
        line-height: 1.1;
      }

      .call-top-profile span {
        font-size: 12px;
        opacity: .78;
      }

      .custom-call-stage .lk-control-bar {
        position: fixed !important;
        left: 50% !important;
        bottom: calc(12px + env(safe-area-inset-bottom)) !important;
        transform: translateX(-50%) !important;
        z-index: 999999 !important;
        background: rgba(15,15,15,.94) !important;
        border: 1px solid rgba(255,255,255,.14) !important;
        border-radius: 999px !important;
        padding: 8px !important;
      }

      .outgoing-call-card,
      .call-ended-card {
        width: min(390px, 92vw);
        padding: 34px 28px;
        border-radius: 34px;
        text-align: center;
        background: rgba(255,255,255,.96);
        box-shadow: 0 30px 100px rgba(0,0,0,.35);
      }

      .outgoing-avatar-ring {
        width: 116px;
        height: 116px;
        margin: 0 auto 18px;
        padding: 5px;
        border-radius: 999px;
        background: linear-gradient(135deg,#ff9d2e,#ff5b2f);
        animation: callPulse 1.3s infinite;
      }

      .call-type-label {
        display: inline-block;
        padding: 8px 16px;
        border-radius: 999px;
        background: #fff3eb;
        color: #ff5b2f;
        font-size: 13px;
        font-weight: 900;
        margin-bottom: 14px;
      }

      .outgoing-call-card h1,
      .call-ended-card h1 {
        margin: 0;
        font-size: 28px;
        font-weight: 900;
        color: #111827;
      }

      .outgoing-call-card p,
      .call-ended-card p {
        margin: 12px auto 22px;
        color: #6b7280;
      }

      .ring-dots {
        display: flex;
        justify-content: center;
        gap: 8px;
        margin-bottom: 26px;
      }

      .ring-dots span {
        width: 10px;
        height: 10px;
        border-radius: 999px;
        background: #ff5b2f;
        animation: dotBounce 1s infinite ease-in-out;
      }

      .ring-dots span:nth-child(2) {
        animation-delay: .15s;
      }

      .ring-dots span:nth-child(3) {
        animation-delay: .3s;
      }

      .cancel-call-btn,
      .call-again-btn,
      .back-chat-btn {
        width: 100%;
        border: 0;
        border-radius: 18px;
        padding: 14px 18px;
        font-weight: 900;
      }

      .cancel-call-btn {
        color: white;
        background: #ef4444;
      }

      .call-ended-actions {
        display: grid;
        gap: 12px;
      }

      .call-again-btn {
        color: white;
        background: linear-gradient(135deg,#ff9d2e,#ff5b2f);
      }

      .back-chat-btn {
        color: #ff5b2f;
        background: #fff3eb;
      }

      .call-ended-icon {
        width: 86px;
        height: 86px;
        margin: 0 auto 20px;
        border-radius: 999px;
        display: grid;
        place-items: center;
        color: white;
        font-size: 40px;
        font-weight: 900;
        background: linear-gradient(135deg,#ff9d2e,#ff5b2f);
      }

      .call-ended-icon.danger {
        background: #ef4444;
      }

      @media (max-width: 576px) {
        .call-grid {
          height: calc(100svh - 90px);
          grid-template-columns: 1fr;
          padding: 6px;
        }

        .custom-call-tile {
          min-height: calc((100svh - 115px) / 2);
        }

        .big-speaking-ring,
        .big-profile-ring {
          width: 122px;
          height: 122px;
        }

        .call-top-profile {
          top: 8px;
          max-width: calc(100vw - 20px);
        }

        .call-top-profile strong {
          max-width: 155px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }

      @keyframes callPulse {
        0% { box-shadow: 0 0 0 0 rgba(255,91,47,.45); }
        70% { box-shadow: 0 0 0 24px rgba(255,91,47,0); }
        100% { box-shadow: 0 0 0 0 rgba(255,91,47,0); }
      }

      @keyframes speakingPulse {
        0% { box-shadow: 0 0 0 0 rgba(34,197,94,.55); }
        70% { box-shadow: 0 0 0 12px rgba(34,197,94,0); }
        100% { box-shadow: 0 0 0 0 rgba(34,197,94,0); }
      }

      @keyframes speakingPulseBig {
        0% { box-shadow: 0 0 0 0 rgba(255,91,47,.42); }
        70% { box-shadow: 0 0 0 34px rgba(255,91,47,0); }
        100% { box-shadow: 0 0 0 0 rgba(255,91,47,0); }
      }

      @keyframes dotBounce {
        0%, 80%, 100% { transform: scale(.7); opacity: .45; }
        40% { transform: scale(1); opacity: 1; }
      }
    `}</style>
  );
}