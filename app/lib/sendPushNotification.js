import { getMessaging } from "firebase-admin/messaging";
import { getFirebaseAdminApp } from "./firebaseAdmin";
import User from "../models/User";

export async function sendPushToUsers({ userIds, title, body, url, icon }) {
  console.log("PUSH userIds:", userIds);

  if (!userIds?.length) {
    console.log("PUSH stopped: no userIds");
    return;
  }

  const users = await User.find({
    _id: { $in: userIds },
    fcmTokens: { $exists: true, $ne: [] },
  }).select("fcmTokens");

  console.log("PUSH users with tokens:", users.length);

  const tokens = users.flatMap((user) => user.fcmTokens || []);

  console.log("PUSH token count:", tokens.length);

  if (!tokens.length) return;

  const app = getFirebaseAdminApp();
  const messaging = getMessaging(app);

  const response = await messaging.sendEachForMulticast({
    tokens,
    notification: {
      title,
      body,
    },
    webpush: {
      notification: {
        icon: icon || "/default-avatar.png",
      },
      fcmOptions: {
        link: url || "/chat",
      },
    },
  });

  console.log("PUSH response:", response);
}