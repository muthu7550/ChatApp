let ringtoneAudio = null;
let messageAudio = null;

export async function requestNotificationPermission() {
  if (typeof window === "undefined") return false;
  if (!("Notification" in window)) return false;

  if (Notification.permission === "granted") return true;

  const permission = await Notification.requestPermission();
  return permission === "granted";
}

export function playNotifySound(type = "message") {
  if (typeof window === "undefined") return;

  if (type === "stop") {
    stopNotifySound();
    return;
  }

  if (type === "call") {
    if (!ringtoneAudio) {
      ringtoneAudio = new Audio("/iphone.mp3");
      ringtoneAudio.loop = true;
      ringtoneAudio.volume = 0.7;
    }

    if (!ringtoneAudio.paused) return;

    ringtoneAudio.currentTime = 0;
    ringtoneAudio.play().catch((error) => {
      console.log("Call sound blocked:", error);
    });

    return;
  }

  if (!messageAudio) {
    messageAudio = new Audio("/call.wav");
    messageAudio.loop = false;
    messageAudio.volume = 0.5;
  }

  messageAudio.currentTime = 0;
  messageAudio.play().catch((error) => {
    console.log("Message sound blocked:", error);
  });
}

export function stopNotifySound() {
  if (ringtoneAudio) {
    ringtoneAudio.pause();
    ringtoneAudio.currentTime = 0;
  }

  if (messageAudio) {
    messageAudio.pause();
    messageAudio.currentTime = 0;
  }
}

export function showBrowserNotification({
  title,
  body,
  icon,
  url,
  onClick,
}) {
  if (typeof window === "undefined") return;
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  const notification = new Notification(title, {
    body,
    icon: icon || "/default-avatar.png",
  });

  notification.onclick = () => {
    notification.close();
    window.focus();

    if (typeof onClick === "function") {
      onClick();
      return;
    }

    if (url) {
      window.location.href = url;
    }
  };
}