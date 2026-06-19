import admin from "./firebaseAdmin";
import User from "../models/User";

export async function sendPushToUsers({ userIds, title, body, url, icon }) {
  const users = await User.find({
    _id: { $in: userIds },
    fcmTokens: { $exists: true, $ne: [] },
  }).select("fcmTokens");

  const tokens = users.flatMap((user) => user.fcmTokens || []);

  if (!tokens.length) return;

  await admin.messaging().sendEachForMulticast({
    tokens,
    notification: {
      title,
      body,
      imageUrl: icon || undefined,
    },
    webpush: {
      notification: {
        icon: icon || "/default-avatar.png",
        badge: "/default-avatar.png",
      },
      fcmOptions: {
        link: url,
      },
    },
  });
}