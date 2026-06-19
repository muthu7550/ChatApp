import { getMessaging } from "firebase-admin/messaging";
import { getFirebaseAdminApp } from "./firebaseAdmin";
import User from "../models/User";

export async function sendPushToUsers({
  userIds = [],
  title = "ChatterBox",
  body = "New notification",
  url = "/chat",
  icon = "/default-avatar.png",
}) {
  try {
    console.log("PUSH userIds:", userIds);

    if (!userIds?.length) {
      console.log("PUSH stopped: no userIds");
      return;
    }

    const users = await User.find({
      _id: { $in: userIds },
      fcmTokens: { $exists: true, $ne: [] },
    }).select("name email fcmTokens");

    console.log("PUSH users with tokens:", users.length);

    const tokens = users.flatMap((user) => user.fcmTokens || []);

    console.log("PUSH token count:", tokens.length);

    if (!tokens.length) {
      console.log("PUSH stopped: no tokens");
      return;
    }

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
          icon,
          badge: "/default-avatar.png",
        },
        fcmOptions: {
          link: url,
        },
      },
    });

    console.log("PUSH RESPONSE:", response);
    console.log("SUCCESS:", response.successCount);
    console.log("FAILED:", response.failureCount);
    console.log("DETAILS:", response.responses);

    return response;
  } catch (error) {
    console.error("SEND PUSH ERROR:", error);
  }
}