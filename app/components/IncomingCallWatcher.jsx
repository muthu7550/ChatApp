"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  playNotifySound,
  stopNotifySound,
  showBrowserNotification,
} from "../lib/notifyClient";

export default function IncomingCallWatcher({ currentUser, incomingCallId }) {
  const router = useRouter();

  const [incomingCall, setIncomingCall] = useState(null);
  const activeCallRef = useRef(null);
  const handledCallRef = useRef(new Set());

  useEffect(() => {
    activeCallRef.current = incomingCall;
  }, [incomingCall]);

  function getAuthHeaders(extra = {}) {
    const token = localStorage.getItem("token");

    return {
      Authorization: token ? `Bearer ${token}` : "",
      ...extra,
    };
  }

  function getConversationId(call) {
    return call?.conversation?._id || call?.conversation;
  }

  function getCallType(call) {
    return call?.callType || call?.type || "audio";
  }

  function showCall(call) {
    if (!call?._id) return;
    if (handledCallRef.current.has(call._id)) return;

    setIncomingCall(call);
    playNotifySound("call");

    showBrowserNotification({
      title: `Incoming ${getCallType(call)} call`,
      body: `${call?.caller?.name || "Someone"} is calling you`,
      icon: call?.caller?.avatar || "/default-avatar.png",
      url: `/chat?incomingCallId=${call._id}`,
    });
  }

  useEffect(() => {
    async function loadCallById() {
      if (!incomingCallId || !currentUser?._id) return;

      try {
        const res = await fetch(`/api/calls?callId=${incomingCallId}`, {
          headers: getAuthHeaders(),
        });

        const result = await res.json().catch(() => null);
        const call = result?.call;

        if (call?._id && call?.status === "ringing") {
          showCall(call);
        }
      } catch (error) {
        console.error("Load incoming call error:", error);
      }
    }

    loadCallById();
  }, [incomingCallId, currentUser?._id]);

  useEffect(() => {
    if (!currentUser?._id) return;

    const interval = setInterval(async () => {
      try {
        if (activeCallRef.current?._id) return;

        const res = await fetch(
          `/api/calls?userId=${currentUser._id}&mode=ringing`,
          {
            headers: getAuthHeaders(),
          }
        );

        const result = await res.json().catch(() => null);
        const call = result?.call;

        if (call?._id && call?.status === "ringing") {
          showCall(call);
        }
      } catch (error) {
        console.error("Call polling error:", error);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [currentUser?._id]);

  useEffect(() => {
    if (!incomingCall?._id) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/calls?callId=${incomingCall._id}`, {
          headers: getAuthHeaders(),
        });

        const result = await res.json().catch(() => null);
        const latestCall = result?.call;

        if (!latestCall?._id) return;

        if (["cancelled", "ended", "rejected", "missed"].includes(latestCall.status)) {
          stopNotifySound();
          handledCallRef.current.add(latestCall._id);
          setIncomingCall(null);
        }
      } catch (error) {
        console.error("Incoming call watch error:", error);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [incomingCall?._id]);

  useEffect(() => {
    if (!incomingCall?._id) return;

    const timer = setTimeout(() => {
      if (activeCallRef.current?._id) {
        updateCall("missed", false);
      }
    }, 30000);

    return () => clearTimeout(timer);
  }, [incomingCall?._id]);

  async function updateCall(status, navigate = true) {
    if (!incomingCall?._id) return;

    const call = incomingCall;

    stopNotifySound();
    handledCallRef.current.add(call._id);
    setIncomingCall(null);

    await fetch("/api/calls", {
      method: "PUT",
      headers: getAuthHeaders({
        "Content-Type": "application/json",
      }),
      body: JSON.stringify({
        callId: call._id,
        status,
      }),
    });

    if (status === "accepted" && navigate) {
      router.push(
        `/call?room=${getConversationId(call)}&type=${getCallType(call)}&callId=${call._id}`
      );
    }
  }

  if (!incomingCall?._id) return null;

  return (
    <div className="incoming-call-layer">
      <style>{`
        .incoming-call-layer {
          position: fixed;
          inset: 0;
          z-index: 999999;
          background: rgba(0,0,0,.78);
          backdrop-filter: blur(12px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 18px;
        }

        .incoming-call-card {
          width: min(370px, 100%);
          border-radius: 32px;
          padding: 30px;
          text-align: center;
          background: white;
          box-shadow: 0 30px 100px rgba(0,0,0,.4);
        }

        .caller-ring {
          width: 112px;
          height: 112px;
          margin: 0 auto;
          padding: 5px;
          border-radius: 999px;
          background: linear-gradient(135deg,#ff9d2e,#ff5b2f);
          animation: pulseCall 1.2s infinite;
        }

        .caller-ring img {
          width: 100%;
          height: 100%;
          border-radius: 999px;
          object-fit: cover;
          border: 4px solid white;
        }

        .call-pill {
          margin-top: 18px;
          display: inline-block;
          padding: 8px 16px;
          border-radius: 999px;
          background: #fff3eb;
          color: #ff5b2f;
          font-weight: 900;
          font-size: 13px;
        }

        .call-actions {
          display: flex;
          justify-content: center;
          gap: 28px;
          margin-top: 26px;
        }

        .call-action {
          width: 68px;
          height: 68px;
          border: 0;
          border-radius: 999px;
          color: white;
          font-size: 28px;
          font-weight: 900;
        }

        .reject {
          background: #ef4444;
        }

        .accept {
          background: #22c55e;
        }

        @keyframes pulseCall {
          0% { box-shadow: 0 0 0 0 rgba(255,91,47,.45); }
          70% { box-shadow: 0 0 0 22px rgba(255,91,47,0); }
          100% { box-shadow: 0 0 0 0 rgba(255,91,47,0); }
        }
      `}</style>

      <div className="incoming-call-card">
        <div className="caller-ring">
          <img
            src={
              incomingCall?.caller?.avatar ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                incomingCall?.caller?.name || "User"
              )}&background=ff6b2c&color=fff&bold=true`
            }
            alt="caller"
          />
        </div>

        <div className="call-pill">Incoming {getCallType(incomingCall)} call</div>

        <h2 className="fw-bold mt-3 mb-1">
          {incomingCall?.caller?.name || "Someone"}
        </h2>

        <p className="text-secondary mb-0">ChatterBox Pro Max is ringing...</p>

        <div className="call-actions">
          <button onClick={() => updateCall("rejected")} className="call-action reject">
            ✕
          </button>

          <button onClick={() => updateCall("accepted")} className="call-action accept">
            ✓
          </button>
        </div>
      </div>
    </div>
  );
}