"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  FaAddressBook,
  FaFileAlt,
  FaImage,
  FaLocationArrow,
  FaMapMarkerAlt,
  FaMicrophone,
  FaPaperPlane,
  FaPhoneAlt,
  FaPlus,
  FaTimes,
  FaExclamationTriangle,
  FaStop,
  FaTrash,
  FaRegSmile,
  FaSearch,
  FaUser,
} from "react-icons/fa";

const MAX_FILE_SIZE_MB = 4;
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;
const ORANGE_GRADIENT = "linear-gradient(135deg, #ff9d2e, #ff5b2f)";

const EMOJIS = [
  "😀",
  "😃",
  "😄",
  "😁",
  "😆",
  "😂",
  "🤣",
  "😊",
  "😍",
  "😘",
  "😎",
  "🥰",
  "😇",
  "😉",
  "😋",
  "😜",
  "🤩",
  "😢",
  "😭",
  "😡",
  "👍",
  "👎",
  "👏",
  "🙏",
  "💪",
  "🔥",
  "❤️",
  "💔",
  "💯",
  "🎉",
  "✨",
  "⭐",
  "🌟",
  "😴",
  "🤔",
  "🙄",
  "😬",
  "😱",
  "🥳",
  "🤝",
  "✅",
  "❌",
  "📌",
  "📎",
  "📷",
  "🎧",
  "🎮",
  "🍕",
  "☕",
  "🚀",
];

const GIFS = [
  {
    title: "Happy",
    url: "https://media.giphy.com/media/111ebonMs90YLu/giphy.gif",
  },
  {
    title: "Laugh",
    url: "https://media.giphy.com/media/10JhviFuU2gWD6/giphy.gif",
  },
  {
    title: "Wow",
    url: "https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif",
  },
  {
    title: "Love",
    url: "https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif",
  },
  {
    title: "Clap",
    url: "https://media.giphy.com/media/nbvFVPiEiJH6JOGIok/giphy.gif",
  },
  {
    title: "Dance",
    url: "https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif",
  },
  {
    title: "Yes",
    url: "https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif",
  },
  { title: "No", url: "https://media.giphy.com/media/d10dMmzqCYqQ0/giphy.gif" },
];

export default function Composer({ onSend, currentUser }) {
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [largeFileError, setLargeFileError] = useState(null);

  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [voiceBlob, setVoiceBlob] = useState(null);
  const [voiceUrl, setVoiceUrl] = useState("");

  const [showEmojiGif, setShowEmojiGif] = useState(false);
  const [emojiGifTab, setEmojiGifTab] = useState("emoji");
  const [gifSearch, setGifSearch] = useState("");

  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [liveLocationHours, setLiveLocationHours] = useState(1);

  const [showContactPicker, setShowContactPicker] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  const attachRef = useRef(null);
  const emojiGifRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  const canSendTextOrFile = text.trim() || pendingFile;
  const showSendButton = canSendTextOrFile || voiceBlob;

  const filteredGifs = useMemo(() => {
    const value = gifSearch.toLowerCase().trim();
    if (!value) return GIFS;
    return GIFS.filter((gif) => gif.title.toLowerCase().includes(value));
  }, [gifSearch]);

  useEffect(() => {
    function handleOutsideClick(e) {
      if (attachRef.current && !attachRef.current.contains(e.target)) {
        setShowAttachMenu(false);
      }

      if (emojiGifRef.current && !emojiGifRef.current.contains(e.target)) {
        setShowEmojiGif(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
      clearInterval(timerRef.current);
      if (voiceUrl) URL.revokeObjectURL(voiceUrl);
    };
  }, [voiceUrl]);

  function insertEmoji(emoji) {
    if (voiceBlob || recording || uploading) return;
    setText((prev) => prev + emoji);
  }

  async function sendGif(gif) {
    if (!currentUser?._id) return alert("Please login again");

    setShowEmojiGif(false);
    setShowAttachMenu(false);

    await onSend({
      text: gif.title || "GIF",
      attachments: [
        {
          url: gif.url,
          name: `${gif.title || "gif"}.gif`,
          size: 0,
          mimeType: "image/gif",
          type: "image",
          publicId: null,
        },
      ],
      location: null,
    });
  }

  async function uploadVoiceBlob(blob) {
    const file = new File([blob], `voice-${Date.now()}.webm`, {
      type: "audio/webm",
    });

    const formData = new FormData();
    formData.append("file", file);

    const token = localStorage.getItem("token");

    const res = await fetch("/api/upload", {
      method: "POST",
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: formData,
    });

    const uploaded = await res.json().catch(() => null);

    if (!res.ok || !uploaded?.success) {
      throw new Error(uploaded?.error || "Voice upload failed");
    }

    return {
      url: uploaded?.url,
      name: uploaded?.name || file.name,
      size: uploaded?.size || file.size,
      mimeType: uploaded?.mimeType || "audio/webm",
      type: "audio",
      publicId: uploaded?.publicId,
    };
  }

  async function handleSend() {
      setText("");
      setPendingFile(null);
      clearVoicePreview();
      setShowEmojiGif(false);
    if (!currentUser?._id) return alert("Please login again");
    if (!text.trim() && !pendingFile && !voiceBlob) return;

    try {
      let attachments = pendingFile ? [pendingFile] : [];

      if (voiceBlob) {
        const uploadedVoice = await uploadVoiceBlob(voiceBlob);
        attachments = [uploadedVoice];
      }

      await onSend({
        text: text.trim() || (voiceBlob ? "Voice message" : ""),
        attachments,
        location: null,
      });

    
    } catch (error) {
      console.error(error);
      alert(error.message || "Send failed");
    }
  }

  async function startRecording() {
    if (!currentUser?._id) return alert("Please login again");

    try {
      setShowAttachMenu(false);
      setShowEmojiGif(false);
      clearVoicePreview();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);

        setVoiceBlob(blob);
        setVoiceUrl(url);

        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setRecording(true);
      setRecordSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordSeconds((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error(error);
      alert("Microphone permission denied");
    }
  }

  function stopRecording() {
    if (!mediaRecorderRef.current) return;
    mediaRecorderRef.current.stop();
    setRecording(false);
    clearInterval(timerRef.current);
  }

  function clearVoicePreview() {
    if (voiceUrl) URL.revokeObjectURL(voiceUrl);
    setVoiceBlob(null);
    setVoiceUrl("");
    setRecordSeconds(0);
    chunksRef.current = [];
  }

  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileSizeMb = file.size / 1024 / 1024;

    if (file.size > MAX_FILE_SIZE) {
      setShowAttachMenu(false);
      setLargeFileError({
        name: file.name,
        size: fileSizeMb.toFixed(2),
        max: MAX_FILE_SIZE_MB,
      });
      e.target.value = "";
      return;
    }

    try {
      setUploading(true);
      setShowAttachMenu(false);
      setShowEmojiGif(false);
      clearVoicePreview();

      const formData = new FormData();
      formData.append("file", file);

      const token = localStorage.getItem("token");

      const res = await fetch("/api/upload", {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: formData,
      });

      const uploaded = await res.json().catch(() => null);

      if (res.status === 413) {
        setLargeFileError({
          name: file.name,
          size: fileSizeMb.toFixed(2),
          max: MAX_FILE_SIZE_MB,
        });
        return;
      }

      if (!res.ok || !uploaded?.success) {
        alert(uploaded?.error || "Upload failed");
        return;
      }

      setPendingFile({
        url: uploaded?.url,
        name: uploaded?.name,
        size: uploaded?.size,
        mimeType: uploaded?.mimeType,
        type: getFileType(uploaded?.mimeType),
        publicId: uploaded?.publicId,
      });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function openLocationPicker() {
    if (!currentUser?._id) return alert("Please login again");

    setShowAttachMenu(false);
    setShowEmojiGif(false);
    setShowLocationPicker(true);
  }

  function sendCurrentLocation() {
    setShowLocationPicker(false);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos?.coords?.latitude;
        const lng = pos?.coords?.longitude;

        await onSend({
          text: "Shared current location",
          attachments: [],
          location: {
            type: "current",
            lat,
            lng,
            label: "My current location",
            mapUrl: `https://www.google.com/maps?q=${lat},${lng}`,
          },
        });
      },
      () => alert("Location permission denied"),
    );
  }

  function sendLiveLocation() {
    setShowLocationPicker(false);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos?.coords?.latitude;
        const lng = pos?.coords?.longitude;
        const hours = Number(liveLocationHours);

        await onSend({
          text: `Shared live location for ${hours} hour${hours > 1 ? "s" : ""}`,
          attachments: [],
          location: {
            type: "live",
            lat,
            lng,
            label: `Live location · ${hours} hour${hours > 1 ? "s" : ""}`,
            mapUrl: `https://www.google.com/maps?q=${lat},${lng}`,
            expiresAt: new Date(
              Date.now() + hours * 60 * 60 * 1000,
            ).toISOString(),
            durationHours: hours,
          },
        });
      },
      () => alert("Location permission denied"),
    );
  }

  function openContactPicker() {
    if (!currentUser?._id) return alert("Please login again");

    setShowAttachMenu(false);
    setShowEmojiGif(false);
    setShowContactPicker(true);
  }

  async function sendContact() {
    if (!contactName.trim()) return alert("Contact name required");
    if (!contactPhone.trim()) return alert("Contact phone required");

    const name = contactName.trim();
    const phone = contactPhone.trim();

    await onSend({
      text: `Contact: ${name}\n${phone}`,
      attachments: [],
      location: null,
      contact: {
        name,
        phone,
      },
    });

    setContactName("");
    setContactPhone("");
    setShowContactPicker(false);
  }

  function formatTime(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec.toString().padStart(2, "0")}`;
  }

  return (
    <div className="composer-shell bg-white border-top position-relative">
      <style>{`
        .composer-shell {
          box-shadow: 0 -10px 30px rgba(15, 23, 42, 0.04);
        }

        .composer-icon-btn {
          width: 44px;
          height: 44px;
          border: 0;
          border-radius: 999px;
          background: #f4f4f5;
          color: #64748b;
          transition: 0.18s ease;
        }

        .composer-icon-btn:hover {
          background: #fff3eb;
          color: #ff5b2f;
        }

        .composer-send-btn {
          width: 46px;
          height: 46px;
          border: 0;
          border-radius: 999px;
          background: ${ORANGE_GRADIENT};
          color: #fff;
          box-shadow: 0 10px 24px rgba(255, 91, 47, 0.28);
        }

        .composer-send-btn:disabled {
          opacity: 0.45;
          box-shadow: none;
          cursor: not-allowed;
        }

        .composer-input {
          min-height: 46px;
          max-height: 110px;
          resize: none;
          border: 0 !important;
          border-radius: 999px !important;
          background: #f5f5f5 !important;
          color: #111827 !important;
          box-shadow: none !important;
        }

        .composer-input:focus {
          background: #f3f4f6 !important;
          box-shadow: 0 0 0 3px rgba(255, 107, 44, 0.12) !important;
        }

        .attach-popover,
        .emoji-gif-popover {
          z-index: 9999;
          background: #ffffff;
          border: 1px solid #f1f1f1;
          border-radius: 22px;
          box-shadow: 0 18px 50px rgba(15, 23, 42, 0.18);
          overflow: hidden;
        }

        .attach-popover {
          width: 250px;
        }

        .emoji-gif-popover {
          width: min(360px, calc(100vw - 24px));
        }

        .attach-popover::after,
        .emoji-gif-popover::after {
          content: "";
          position: absolute;
          bottom: -7px;
          width: 14px;
          height: 14px;
          background: #ffffff;
          transform: rotate(45deg);
          border-right: 1px solid #f1f1f1;
          border-bottom: 1px solid #f1f1f1;
        }

        .attach-popover::after {
          left: 24px;
        }

        .emoji-gif-popover::after {
          left: 76px;
        }

        .attach-item {
          width: 100%;
          border: 0;
          background: #ffffff;
          padding: 14px 18px;
          color: #334155;
          font-weight: 600;
          transition: 0.18s ease;
          cursor: pointer;
        }

        .attach-item:hover {
          background: #fff4ec;
          color: #ff5b2f;
        }

        .attach-icon {
          width: 34px;
          height: 34px;
          border-radius: 999px;
          background: #fff3eb;
          color: #ff5b2f;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .emoji-tab-btn {
          border: 0;
          background: transparent;
          color: #64748b;
          font-weight: 800;
          padding: 12px 16px;
          border-radius: 999px;
        }

        .emoji-tab-btn.active {
          background: #fff3eb;
          color: #ff5b2f;
        }

        .emoji-grid {
          display: grid;
          grid-template-columns: repeat(8, 1fr);
          gap: 6px;
          max-height: 230px;
          overflow-y: auto;
        }

        .emoji-btn {
          height: 36px;
          border: 0;
          border-radius: 12px;
          background: #f8fafc;
          font-size: 20px;
          transition: .15s ease;
        }

        .emoji-btn:hover {
          background: #fff3eb;
          transform: scale(1.08);
        }

        .gif-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          max-height: 230px;
          overflow-y: auto;
        }

        .gif-item {
          border: 0;
          background: #f8fafc;
          border-radius: 16px;
          overflow: hidden;
          padding: 0;
          text-align: left;
        }

        .gif-item:hover {
          box-shadow: 0 10px 24px rgba(255, 91, 47, 0.18);
        }

        .gif-item img {
          width: 100%;
          height: 92px;
          object-fit: cover;
          display: block;
        }

        .gif-item span {
          display: block;
          padding: 8px 10px;
          font-size: 12px;
          font-weight: 700;
          color: #475569;
        }

        .emoji-search {
          border: 0 !important;
          background: #f5f5f5 !important;
          border-radius: 999px !important;
          box-shadow: none !important;
          color: #111827 !important;
        }

        .pending-card,
        .voice-preview-card {
          background: #fff7f1;
          border: 1px solid #ffe0cf;
          border-radius: 22px;
        }

        .recording-pill {
          background: #fff1f2;
          border: 1px solid #fecdd3;
          color: #dc2626;
          border-radius: 999px;
        }

        .record-dot {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: #ef4444;
          animation: pulseRecord 1s infinite;
        }

        @keyframes pulseRecord {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: .45; transform: scale(.85); }
        }

        .error-modal-card,
        .picker-card {
          background: #ffffff;
          color: #111827;
          border-radius: 26px;
          box-shadow: 0 24px 70px rgba(0,0,0,.25);
        }

        .picker-backdrop {
          background: rgba(0,0,0,.45);
          backdrop-filter: blur(6px);
          z-index: 99999;
        }

        .picker-option {
          border: 0;
          border-radius: 20px;
          padding: 16px;
          background: #fff7f1;
          transition: .18s ease;
        }

        .picker-option:hover {
          transform: translateY(-1px);
          box-shadow: 0 12px 28px rgba(255, 91, 47, .14);
        }

        .picker-option-icon {
          width: 48px;
          height: 48px;
          border-radius: 999px;
          background: ${ORANGE_GRADIENT};
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .picker-input {
          border: 0 !important;
          background: #f5f5f5 !important;
          border-radius: 999px !important;
          box-shadow: none !important;
          padding: 13px 18px !important;
        }
      `}</style>

      {largeFileError && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center px-3 picker-backdrop">
          <div
            className="error-modal-card text-center p-4"
            style={{ width: "100%", maxWidth: 420 }}
          >
            <div
              className="mx-auto rounded-circle d-flex align-items-center justify-content-center text-danger mb-3"
              style={{
                width: 72,
                height: 72,
                fontSize: 32,
                background: "#fff1f2",
              }}
            >
              <FaExclamationTriangle />
            </div>

            <h4 className="fw-bold mb-2">File Too Large</h4>

            <p className="text-secondary mb-3">
              This file is {largeFileError.size} MB. Maximum allowed upload size
              is {largeFileError.max} MB.
            </p>

            <div className="bg-light rounded-4 p-3 mb-3 text-truncate small text-secondary">
              {largeFileError.name}
            </div>

            <button
              type="button"
              onClick={() => setLargeFileError(null)}
              className="btn w-100 rounded-pill py-3 fw-bold text-white border-0"
              style={{ background: ORANGE_GRADIENT }}
            >
              Choose Smaller File
            </button>
          </div>
        </div>
      )}

      {showLocationPicker && (
        <LocationPickerModal
          liveLocationHours={liveLocationHours}
          setLiveLocationHours={setLiveLocationHours}
          onClose={() => setShowLocationPicker(false)}
          onCurrent={sendCurrentLocation}
          onLive={sendLiveLocation}
        />
      )}

      {showContactPicker && (
        <ContactPickerModal
          contactName={contactName}
          setContactName={setContactName}
          contactPhone={contactPhone}
          setContactPhone={setContactPhone}
          onClose={() => setShowContactPicker(false)}
          onSend={sendContact}
        />
      )}

      {uploading && (
        <div className="px-3 px-sm-4 py-3 d-flex align-items-center gap-3 border-bottom bg-white">
          <div
            className="spinner-border spinner-border-sm"
            style={{ color: "#ff5b2f" }}
          />
          <span className="small fw-semibold text-secondary">
            {voiceBlob ? "Uploading voice..." : "Uploading file..."}
          </span>
        </div>
      )}

      {recording && (
        <div className="px-3 px-sm-4 pt-3">
          <div className="recording-pill px-3 py-3 d-flex align-items-center gap-3">
            <span className="record-dot" />
            <span className="fw-bold">Recording...</span>
            <span className="ms-auto fw-bold">{formatTime(recordSeconds)}</span>
            <button
              type="button"
              onClick={stopRecording}
              className="btn btn-danger rounded-circle d-flex align-items-center justify-content-center border-0"
              style={{ width: 36, height: 36 }}
            >
              <FaStop size={12} />
            </button>
          </div>
        </div>
      )}

      {voiceUrl && !recording && !uploading && (
        <div className="px-3 px-sm-4 pt-3">
          <div className="voice-preview-card p-3 d-flex align-items-center gap-3 shadow-sm">
            <div
              className="rounded-circle d-flex align-items-center justify-content-center text-white flex-shrink-0"
              style={{ width: 46, height: 46, background: ORANGE_GRADIENT }}
            >
              <FaMicrophone />
            </div>

            <audio src={voiceUrl} controls className="flex-grow-1" />

            <button
              type="button"
              onClick={clearVoicePreview}
              className="btn rounded-circle d-flex align-items-center justify-content-center text-white border-0 flex-shrink-0"
              style={{ width: 34, height: 34, background: "#ef4444" }}
            >
              <FaTrash size={13} />
            </button>
          </div>
        </div>
      )}

      {pendingFile && !uploading && !voiceUrl && (
        <div className="px-3 px-sm-4 pt-3">
          <div className="pending-card p-3 d-flex align-items-center gap-3 shadow-sm">
            {pendingFile?.type === "image" ? (
              <img
                src={pendingFile?.url}
                className="rounded-4 object-fit-cover"
                width="58"
                height="58"
                alt={pendingFile?.name}
              />
            ) : pendingFile?.type === "video" ? (
              <video
                src={pendingFile?.url}
                className="rounded-4 object-fit-cover"
                width="58"
                height="58"
              />
            ) : pendingFile?.type === "audio" ? (
              <div
                className="rounded-4 bg-white d-flex align-items-center justify-content-center"
                style={{ width: 58, height: 58 }}
              >
                <FaMicrophone style={{ color: "#ff5b2f", fontSize: 24 }} />
              </div>
            ) : (
              <div
                className="rounded-4 bg-white d-flex align-items-center justify-content-center"
                style={{ width: 58, height: 58 }}
              >
                <FaFileAlt style={{ color: "#ff5b2f", fontSize: 24 }} />
              </div>
            )}

            <div className="flex-grow-1 overflow-hidden">
              <div className="fw-bold text-dark text-truncate">
                {pendingFile?.name}
              </div>
              <small className="text-secondary">Ready to send</small>
            </div>

            <button
              type="button"
              onClick={() => setPendingFile(null)}
              className="btn rounded-circle d-flex align-items-center justify-content-center text-white border-0"
              style={{ width: 34, height: 34, background: "#ef4444" }}
            >
              <FaTimes size={13} />
            </button>
          </div>
        </div>
      )}

      <div ref={attachRef} className="position-relative">
        {showAttachMenu && (
          <div className="attach-popover">
            <AttachItem
              icon={<FaImage />}
              label="Image / Video"
              accept="image/*,video/*"
              onChange={handleFileUpload}
              disabled={uploading}
            />
            <AttachItem
              icon={<FaFileAlt />}
              label="Document"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
              onChange={handleFileUpload}
              disabled={uploading}
            />
            <AttachItem
              icon={<FaMicrophone />}
              label="Audio File"
              accept="audio/*"
              onChange={handleFileUpload}
              disabled={uploading}
            />

            <button
              type="button"
              onClick={openContactPicker}
              className="attach-item d-flex align-items-center gap-3 text-start"
            >
              <span className="attach-icon">
                <FaAddressBook />
              </span>
              <span>Contact</span>
            </button>

            <button
              type="button"
              onClick={openLocationPicker}
              className="attach-item d-flex align-items-center gap-3 text-start"
            >
              <span className="attach-icon">
                <FaLocationArrow />
              </span>
              <span>Location</span>
            </button>
          </div>
        )}

        <div ref={emojiGifRef} className="position-relative">
          {showEmojiGif && (
            <>
              <div
                className="emoji-mobile-backdrop"
                onClick={() => setShowEmojiGif(false)}
              />

              <div className="emoji-gif-popover emoji-center-mobile">
                <div className="p-3 border-bottom">
                  <div className="d-flex align-items-center gap-2 bg-light rounded-pill p-1">
                    <button
                      type="button"
                      onClick={() => setEmojiGifTab("emoji")}
                      className={`emoji-tab-btn flex-fill ${
                        emojiGifTab === "emoji" ? "active" : ""
                      }`}
                    >
                      😊 Emoji
                    </button>

                    <button
                      type="button"
                      onClick={() => setEmojiGifTab("gif")}
                      className={`emoji-tab-btn flex-fill ${
                        emojiGifTab === "gif" ? "active" : ""
                      }`}
                    >
                      GIF
                    </button>
                  </div>
                </div>

                {emojiGifTab === "emoji" ? (
                  <div className="p-3">
                    <div className="emoji-grid">
                      {EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => insertEmoji(emoji)}
                          className="emoji-btn"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-3">
                    <div className="position-relative mb-3">
                      <FaSearch className="position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary" />
                      <input
                        value={gifSearch}
                        onChange={(e) => setGifSearch(e.target.value)}
                        placeholder="Search GIF..."
                        className="form-control emoji-search ps-5 py-2"
                      />
                    </div>

                    <div className="gif-grid">
                      {filteredGifs.map((gif) => (
                        <button
                          key={gif.url}
                          type="button"
                          onClick={() => sendGif(gif)}
                          className="gif-item"
                        >
                          <img src={gif.url} alt={gif.title} />
                          <span>{gif.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          <footer className="px-2 px-sm-4 py-3 d-flex align-items-end gap-2">
            <button
              type="button"
              onClick={() => {
                setShowAttachMenu((prev) => !prev);
                setShowEmojiGif(false);
              }}
              disabled={uploading || recording || voiceBlob}
              className="composer-icon-btn flex-shrink-0 d-flex align-items-center justify-content-center"
            >
              <FaPlus />
            </button>

            <button
              type="button"
              onClick={() => {
                setShowEmojiGif((prev) => !prev);
                setShowAttachMenu(false);
              }}
              disabled={uploading || recording || voiceBlob}
              className="composer-icon-btn flex-shrink-0 d-flex align-items-center justify-content-center"
            >
              <FaRegSmile />
            </button>

            <textarea
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                if (voiceBlob) clearVoicePreview();
              }}
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" &&
                  !e.shiftKey &&
                  !uploading &&
                  !recording
                ) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={uploading || recording || voiceBlob}
              rows={1}
              placeholder={
                voiceBlob
                  ? "Voice message ready"
                  : pendingFile
                    ? "Add a caption..."
                    : "Type a message"
              }
              className="form-control composer-input px-4 py-2 flex-grow-1"
            />

            {showSendButton ? (
              <button
                type="button"
                onClick={handleSend}
                disabled={uploading || recording}
                className="composer-send-btn flex-shrink-0 d-flex align-items-center justify-content-center"
              >
                <FaPaperPlane size={15} />
              </button>
            ) : recording ? (
              <button
                type="button"
                onClick={stopRecording}
                className="composer-send-btn flex-shrink-0 d-flex align-items-center justify-content-center"
              >
                <FaStop size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={startRecording}
                disabled={uploading}
                className="composer-send-btn flex-shrink-0 d-flex align-items-center justify-content-center"
              >
                <FaMicrophone size={16} />
              </button>
            )}
          </footer>
        </div>
      </div>
    </div>
  );
}

function LocationPickerModal({
  liveLocationHours,
  setLiveLocationHours,
  onClose,
  onCurrent,
  onLive,
}) {
  return (
    <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center px-3 picker-backdrop">
      <div
        className="picker-card overflow-hidden"
        style={{ width: "100%", maxWidth: 440 }}
      >
        <div className="p-4 border-bottom d-flex align-items-center justify-content-between">
          <div>
            <h5 className="fw-bold mb-1 text-dark">Share Location</h5>
            <small className="text-secondary">
              Choose current or live location
            </small>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn rounded-circle bg-light d-flex align-items-center justify-content-center border-0"
            style={{ width: 38, height: 38 }}
          >
            <FaTimes />
          </button>
        </div>

        <div className="p-4">
          <button
            type="button"
            onClick={onCurrent}
            className="picker-option w-100 d-flex align-items-center gap-3 text-start mb-3"
          >
            <span className="picker-option-icon">
              <FaLocationArrow />
            </span>

            <span>
              <span className="d-block fw-bold text-dark">
                Share Current Location
              </span>
              <small className="text-secondary">
                Send your location one time
              </small>
            </span>
          </button>

          <div
            className="rounded-4 p-3"
            style={{ background: "#f8fafc", border: "1px solid #eef2f7" }}
          >
            <div className="d-flex align-items-center gap-3 mb-3">
              <span className="picker-option-icon">
                <FaMapMarkerAlt />
              </span>

              <div>
                <div className="fw-bold text-dark">Share Live Location</div>
                <small className="text-secondary">
                  Choose how many hours to share
                </small>
              </div>
            </div>

            <div className="d-flex gap-2 mb-3">
              {[1, 2, 4, 8].map((hour) => (
                <button
                  key={hour}
                  type="button"
                  onClick={() => setLiveLocationHours(hour)}
                  className="btn rounded-pill flex-fill fw-bold border-0"
                  style={{
                    background:
                      liveLocationHours === hour ? ORANGE_GRADIENT : "#fff3eb",
                    color: liveLocationHours === hour ? "#ffffff" : "#ff5b2f",
                  }}
                >
                  {hour}h
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={onLive}
              className="btn w-100 rounded-pill py-3 fw-bold text-white border-0"
              style={{ background: ORANGE_GRADIENT }}
            >
              Share Live Location
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ContactPickerModal({
  contactName,
  setContactName,
  contactPhone,
  setContactPhone,
  onClose,
  onSend,
}) {
  return (
    <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center px-3 picker-backdrop">
      <div
        className="picker-card overflow-hidden"
        style={{ width: "100%", maxWidth: 420 }}
      >
        <div className="p-4 border-bottom d-flex align-items-center justify-content-between">
          <div>
            <h5 className="fw-bold mb-1 text-dark">Share Contact</h5>
            <small className="text-secondary">
              Send a name and phone number
            </small>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn rounded-circle bg-light d-flex align-items-center justify-content-center border-0"
            style={{ width: 38, height: 38 }}
          >
            <FaTimes />
          </button>
        </div>

        <div className="p-4">
          <div className="mb-3">
            <label className="form-label small fw-bold text-secondary">
              Contact Name
            </label>
            <div className="position-relative">
              <FaUser className="position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary" />
              <input
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Enter contact name"
                className="form-control picker-input ps-5"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label small fw-bold text-secondary">
              Phone Number
            </label>
            <div className="position-relative">
              <FaPhoneAlt className="position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary" />
              <input
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="Enter phone number"
                className="form-control picker-input ps-5"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={onSend}
            className="btn w-100 rounded-pill py-3 fw-bold text-white border-0"
            style={{ background: ORANGE_GRADIENT }}
          >
            Share Contact
          </button>
        </div>
      </div>
    </div>
  );
}

function AttachItem({ icon, label, accept, onChange, disabled }) {
  return (
    <label className="attach-item d-flex align-items-center gap-3">
      <span className="attach-icon">{icon}</span>
      <span>{label}</span>
      <input
        type="file"
        hidden
        disabled={disabled}
        onChange={onChange}
        accept={accept}
      />
    </label>
  );
}

function getFileType(mime = "") {
  if (mime?.startsWith("image")) return "image";
  if (mime?.startsWith("video")) return "video";
  if (mime?.startsWith("audio")) return "audio";
  if (mime?.includes("pdf")) return "pdf";
  if (mime?.includes("word")) return "doc";
  return "file";
}
