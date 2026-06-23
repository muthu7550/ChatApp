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

  useEffect(() => {
    async function loadCallFromUrl() {
      if (!incomingCallId || !currentUser?._id) return;

      try {
        const res = await fetch(`/api/calls?callId=${incomingCallId}`);
        const result = await res.json();

        const call = result?.call;

        if (call?._id && call?.status === "ringing") {
          handledCallRef.current.add(call?._id);
          setIncomingCall(call);
          playNotifySound("call");
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
        const res = await fetch(`/api/calls?userId=${currentUser?._id}`);
        const result = await res.json();

        const call = result?.call;

        if (call?._id && call?.status === "ringing" && !incomingCall) {
          handledCallRef.current.add(call?._id);
          setIncomingCall(call);

          playNotifySound("call");

          showBrowserNotification({
            title: `Incoming ${call?.callType || call?.type} call`,
            body: `${call?.caller?.name || "Someone"} is calling you`,
            icon: call?.caller?.avatar || "/default-avatar.png",
            onClick: () => {
              setIncomingCall(call);
              router.push("/chat");
            },
          });  
        }   
      } catch (error) {
        console.error("Call polling error:", error);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [currentUser?._id]);

  async function updateCall(status) {
    if(status === "rejected"){
      playNotifySound('stop');
    }
    if (!incomingCall?._id) return;
    stopNotifySound();
    const callToHandle = incomingCall;

    handledCallRef.current.add(callToHandle?._id);
    setIncomingCall(null);

    const token = localStorage.getItem("token");

    await fetch("/api/calls", {
      method: "PUT",
 headers: {
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  },
      body: JSON.stringify({
        callId: callToHandle?._id,
        status,
      }),
    });

    if (status === "accepted") {
      router.push(
        `/call?room=${callToHandle?.conversation}&type=${
          callToHandle?.callType || callToHandle?.type
        }&callId=${callToHandle?._id}`,
      );
    }
  }

  if (!incomingCall?._id) return null;

  return (
    <div className="position-fixed top-0 start-0 w-100 h-100 bg-black bg-opacity-75 d-flex align-items-center justify-content-center z-3">
      <div
        className="bg-dark text-white rounded-4 p-4 text-center shadow-lg"
        style={{ width: 360 }}
      >
        <img
          src={incomingCall?.caller?.avatar || "/default-avatar.png"}
          className="rounded-circle object-fit-cover border border-4 border-success"
          width="96"
          height="96"
          alt="caller"
        />

        <h2 className="fw-bold mt-4">
          {incomingCall?.caller?.name || "Someone"}
        </h2>

        <p className="text-secondary">
          Incoming {incomingCall?.callType || incomingCall?.type} call...
        </p>

        <div className="d-flex justify-content-center gap-4 mt-4">
          <button
            onClick={() => updateCall("rejected")}
            className="btn btn-danger rounded-circle fs-3"
            style={{ width: 64, height: 64 }}
          >
            ✕
          </button>

          <button
            onClick={() => updateCall("accepted")}
            className="btn btn-success rounded-circle fs-3"
            style={{ width: 64, height: 64 }}
          >
            ✓
          </button>
        </div>
      </div>
    </div>
  );
}
