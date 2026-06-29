"use client";

import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getMessaging,
  getToken,
  isSupported,
} from "firebase/messaging";
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const firebaseAuth = getAuth(app);

/* =========================
   FCM PUSH NOTIFICATION
========================= */
export async function getFcmToken() {
  if (typeof window === "undefined") return null;
  if (!("Notification" in window)) return null;
  if (!("serviceWorker" in navigator)) return null;

  const supported = await isSupported();

  if (!supported) return null;

  const permission = await Notification.requestPermission();

  if (permission !== "granted") return null;

  const registration = await navigator.serviceWorker.register(
    "/firebase-messaging-sw.js"
  );

  const messaging = getMessaging(app);

  const token = await getToken(messaging, {
    vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    serviceWorkerRegistration: registration,
  });

  return token;
}

/* =========================
   PHONE OTP LOGIN
========================= */
export function setupRecaptcha(containerId = "recaptcha-container") {
  if (typeof window === "undefined") return null;

  if (window.recaptchaVerifier) {
    return window.recaptchaVerifier;
  }

  window.recaptchaVerifier = new RecaptchaVerifier(
    firebaseAuth,
    containerId,
    {
      size: "invisible",
    }
  );

  return window.recaptchaVerifier;
}

export async function sendPhoneOtp(phoneNumber) {
  const appVerifier = setupRecaptcha();
  return signInWithPhoneNumber(firebaseAuth, phoneNumber, appVerifier);
}