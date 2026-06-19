"use client";

import { useEffect } from "react";
import { getFcmToken } from "../lib/firebaseClient";

export default function PushNotificationRegister({ currentUser }) {
  useEffect(() => {
    async function registerPush() {
      if (!currentUser?._id) return;

      const token = await getFcmToken();

      console.log("FCM TOKEN:", token);
      alert(token ? "FCM Token Generated" : "FCM Token Failed");

      if (!token) return;

      await fetch("/api/push-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: currentUser._id,
          token,
        }),
      });
    }

    registerPush();
  }, [currentUser?._id]);

  return null;
}