import { cert, getApps, initializeApp } from "firebase-admin/app";

function formatPrivateKey(key) {
  if (!key) return "";

  return key
    .replace(/^"|"$/g, "")
    .replace(/\\n/g, "\n");
}

export function getFirebaseAdminApp() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY),
    }),
  });
}