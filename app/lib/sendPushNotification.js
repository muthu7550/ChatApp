import { getMessaging } from "firebase-admin/messaging";
import { getFirebaseAdminApp } from "./firebaseAdmin";
import User from "../models/User";

export async function sendPushToUsers({ userIds, title, body, url, icon }) {
  if (!userIds?.length) return;

  const users = await User.find({
    _id: { $in: userIds },
    fcmTokens: { $exists: true, $ne: [] },
  }).select("fcmTokens");

  const tokens = users.flatMap((user) => user.fcmTokens || []);

  if (!tokens.length) return;

  const app = getFirebaseAdminApp();
  const messaging = getMessaging(app);

  await messaging.sendEachForMulticast({
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
}