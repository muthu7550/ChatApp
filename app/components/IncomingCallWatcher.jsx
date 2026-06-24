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
  const handledCallRef = useRef(new Set());
  const activeCallRef = useRef(null);

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

  function normalizeConversationId(call) {
    return call?.conversation?._id || call?.conversation;
  }

  function normalizeCallType(call) {
    return call?.callType || call?.type || "audio";
  }

  function openIncomingCall(call) {
    if (!call?._id) return;
    if (handledCallRef.current.has(call._id)) return;

    handledCallRef.current.add(call._id);
    setIncomingCall(call);

    playNotifySound("call");

    showBrowserNotification({
      title: `Incoming ${normalizeCallType(call)} call`,
      body: `${call?.caller?.name || "Someone"} is calling you`,
      icon: call?.caller?.avatar || "/default-avatar.png",
      onClick: () => {
        setIncomingCall(call);
        router.push("/chat");
      },
    });
  }

  useEffect(() => {
    async function loadCallFromUrl() {
      if (!incomingCallId || !currentUser?._id) return;

      try {
        const res = await fetch(`/api/calls?callId=${incomingCallId}`, {
          headers: getAuthHeaders(),
        });

        const result = await res.json().catch(() => null);
        const call = result?.call;

        if (call?._id && call?.status === "ringing") {
          openIncomingCall(call);
        }
      } catch (error) {
        console.error("Load incoming call error:", error);
      }
    }

    loadCallFromUrl();
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
          openIncomingCall(call);
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

        if (
          latestCall.status === "cancelled" ||
          latestCall.status === "ended" ||
          latestCall.status === "rejected" ||
          latestCall.status === "missed"
        ) {
          stopNotifySound();
          setIncomingCall(null);
          handledCallRef.current.add(latestCall._id);
        }
      } catch (error) {
        console.error("Incoming call status watch error:", error);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [incomingCall?._id]);

  useEffect(() => {
    if (!incomingCall?._id) return;

    const missedTimer = setTimeout(async () => {
      if (!activeCallRef.current?._id) return;

      await updateCall("missed", false);
    }, 30000);

    return () => clearTimeout(missedTimer);
  }, [incomingCall?._id]);

  async function updateCall(status, navigateAfterAccept = true) {
    if (!incomingCall?._id) return;

    const callToHandle = incomingCall;

    stopNotifySound();
    handledCallRef.current.add(callToHandle._id);
    setIncomingCall(null);

    try {
      await fetch("/api/calls", {
        method: "PUT",
        headers: getAuthHeaders({
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({
          callId: callToHandle._id,
          status,
        }),
      });

      if (status === "accepted" && navigateAfterAccept) {
        router.push(
          `/call?room=${normalizeConversationId(callToHandle)}&type=${normalizeCallType(
            callToHandle
          )}&callId=${callToHandle._id}`
        );
      }
    } catch (error) {
      console.error("Update call error:", error);
    }
  }

  if (!incomingCall?._id) return null;

  return (
    <div className="incoming-call-layer">
      <style>{`
        .incoming-call-layer {
          position: fixed;
          inset: 0;
          z-index: 99999;
          background:
            radial-gradient(circle at top, rgba(255,157,46,.25), transparent 35%),
            rgba(0,0,0,.78);
          backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 18px;
        }

        .incoming-call-card {
          width: min(370px, 100%);
          border-radius: 32px;
          padding: 28px;
          text-align: center;
          color: #111827;
          background: #ffffff;
          box-shadow: 0 30px 100px rgba(0,0,0,.42);
          border: 1px solid rgba(255,255,255,.45);
          animation: callCardIn .22s ease both;
        }

        .caller-avatar-wrap {
          width: 112px;
          height: 112px;
          margin: 0 auto;
          border-radius: 999px;
          padding: 5px;
          background: linear-gradient(135deg,#ff9d2e,#ff5b2f);
          box-shadow: 0 0 0 0 rgba(255,91,47,.45);
          animation: callerPulse 1.25s infinite;
        }

        .caller-avatar-wrap img {
          width: 100%;
          height: 100%;
          border-radius: 999px;
          object-fit: cover;
          border: 4px solid white;
        }

        .call-type-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-top: 18px;
          padding: 8px 15px;
          border-radius: 999px;
          background: #fff3eb;
          color: #ff5b2f;
          font-size: 13px;
          font-weight: 900;
        }

        .call-actions {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 28px;
          margin-top: 26px;
        }

        .call-action-btn {
          width: 68px;
          height: 68px;
          border: 0;
          border-radius: 999px;
          color: white;
          font-size: 28px;
          font-weight: 900;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: .18s ease;
        }

        .call-action-btn:hover {
          transform: scale(1.06);
        }

        .reject-btn {
          background: #ef4444;
          box-shadow: 0 16px 32px rgba(239,68,68,.35);
        }

        .accept-btn {
          background: #22c55e;
          box-shadow: 0 16px 32px rgba(34,197,94,.35);
        }

        @keyframes callCardIn {
          from {
            opacity: 0;
            transform: translateY(18px) scale(.96);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes callerPulse {
          0% {
            box-shadow: 0 0 0 0 rgba(255,91,47,.45);
          }

          70% {
            box-shadow: 0 0 0 22px rgba(255,91,47,0);
          }

          100% {
            box-shadow: 0 0 0 0 rgba(255,91,47,0);
          }
        }
      `}</style>

      <div className="incoming-call-card">
        <div className="caller-avatar-wrap">
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

        <div className="call-type-pill">
          Incoming {normalizeCallType(incomingCall)} call
        </div>

        <h2 className="fw-bold mt-3 mb-1">
          {incomingCall?.caller?.name || "Someone"}
        </h2>

        <p className="text-secondary mb-0">
          ChatterBox Pro Max is ringing...
        </p>

        <div className="call-actions">
          <button
            type="button"
            onClick={() => updateCall("rejected")}
            className="call-action-btn reject-btn"
            title="Reject"
          >
            ✕
          </button>

          <button
            type="button"
            onClick={() => updateCall("accepted")}
            className="call-action-btn accept-btn"
            title="Accept"
          >
            ✓
          </button>
        </div>
      </div>
    </div>
  );
}