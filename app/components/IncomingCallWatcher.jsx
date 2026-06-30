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
  const [accepting, setAccepting] = useState(false);

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

  function closeIncomingCall(callId) {
    if (callId) {
      handledCallRef.current.add(callId);
    }

    stopNotifySound();
    setAccepting(false);
    setIncomingCall(null);
  }

  function showCall(call) {
    if (!call?._id) return;
    if (handledCallRef.current.has(call._id)) return;
    if (call?.status !== "ringing") return;

    setIncomingCall(call);
    setAccepting(false);
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
        const res = await fetch(`/api/calls?callId=${incomingCallId}&t=${Date.now()}`, {
          cache: "no-store",
          headers: {
            ...getAuthHeaders(),
            "Cache-Control": "no-store",
          },
        });

        const result = await res.json().catch(() => null);
        const call = result?.call;

        if (call?._id && call?.status === "ringing") {
          showCall(call);
        } else {
          closeIncomingCall(call?._id || incomingCallId);
        }
      } catch (error) {
        console.error("Load incoming call error:", error);
      }
    }

    loadCallById();
  }, [incomingCallId, currentUser?._id]);

  useEffect(() => {
    if (!currentUser?._id) return;

    let cancelled = false;
    let busy = false;

    async function pollCall() {
      if (cancelled || busy) return;

      try {
        busy = true;

        const currentActiveCall = activeCallRef.current;

        if (currentActiveCall?._id) {
          const res = await fetch(
            `/api/calls?callId=${currentActiveCall._id}&t=${Date.now()}`,
            {
              cache: "no-store",
              headers: {
                ...getAuthHeaders(),
                "Cache-Control": "no-store",
              },
            }
          );

          const result = await res.json().catch(() => null);
          const latestCall = result?.call;

          if (
            !latestCall?._id ||
            latestCall?.status !== "ringing" ||
            latestCall?.caller?._id?.toString() === currentUser?._id?.toString()
          ) {
            closeIncomingCall(currentActiveCall._id);
          }

          return;
        }

        const res = await fetch(
          `/api/calls?userId=${currentUser._id}&mode=ringing&t=${Date.now()}`,
          {
            cache: "no-store",
            headers: {
              ...getAuthHeaders(),
              "Cache-Control": "no-store",
            },
          }
        );

        const result = await res.json().catch(() => null);
        const call = result?.call;

        if (!cancelled && call?._id && call?.status === "ringing") {
          showCall(call);
        }
      } catch (error) {
        console.warn("Call polling skipped:", error?.message);
      } finally {
        busy = false;
      }
    }

    pollCall();

    const interval = setInterval(pollCall, 500);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [currentUser?._id]);

  useEffect(() => {
    if (!incomingCall?._id || accepting) return;

    const timer = setTimeout(() => {
      if (activeCallRef.current?._id) {
        updateCall("missed", false);
      }
    }, 30000);

    return () => clearTimeout(timer);
  }, [incomingCall?._id, accepting]);

  async function updateCall(status, navigate = true) {
    if (!incomingCall?._id) return;

    const call = incomingCall;
    const room = getConversationId(call);
    const type = getCallType(call);

    stopNotifySound();

    if (status === "accepted") {
      setAccepting(true);

      await fetch("/api/calls", {
        method: "PUT",
        headers: getAuthHeaders({
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({
          callId: call._id,
          status: "accepted",
        }),
      });

      handledCallRef.current.add(call._id);

      router.replace(`/call?room=${room}&type=${type}&callId=${call._id}`);
      return;
    }

    handledCallRef.current.add(call._id);
    setIncomingCall(null);
    setAccepting(false);

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

    if (navigate) {
      router.replace(`/chat?conversationId=${room}&callRefresh=${Date.now()}`);
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
          background: rgba(0,0,0,.82);
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

        .connecting-text {
          margin-top: 22px;
          font-weight: 900;
          color: #22c55e;
        }

        .connect-dots {
          display: flex;
          justify-content: center;
          gap: 7px;
          margin-top: 14px;
        }

        .connect-dots span {
          width: 9px;
          height: 9px;
          border-radius: 999px;
          background: #22c55e;
          animation: dotBounce 1s infinite;
        }

        .connect-dots span:nth-child(2) {
          animation-delay: .15s;
        }

        .connect-dots span:nth-child(3) {
          animation-delay: .3s;
        }

        @keyframes pulseCall {
          0% { box-shadow: 0 0 0 0 rgba(255,91,47,.45); }
          70% { box-shadow: 0 0 0 22px rgba(255,91,47,0); }
          100% { box-shadow: 0 0 0 0 rgba(255,91,47,0); }
        }

        @keyframes dotBounce {
          0%, 80%, 100% { transform: scale(.7); opacity: .45; }
          40% { transform: scale(1); opacity: 1; }
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

        <div className="call-pill">
          Incoming {getCallType(incomingCall)} call
        </div>

        <h2 className="fw-bold mt-3 mb-1">
          {incomingCall?.caller?.name || "Someone"}
        </h2>

        {!accepting ? (
          <>
            <p className="text-secondary mb-0">
              ChatterBox Pro Max is ringing...
            </p>

            <div className="call-actions">
              <button
                onClick={() => updateCall("rejected")}
                className="call-action reject"
                type="button"
              >
                ✕
              </button>

              <button
                onClick={() => updateCall("accepted")}
                className="call-action accept"
                type="button"
              >
                ✓
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="connecting-text">Connecting to call...</div>

            <div className="connect-dots">
              <span />
              <span />
              <span />
            </div>
          </>
        )}
      </div>
    </div>
  );
}