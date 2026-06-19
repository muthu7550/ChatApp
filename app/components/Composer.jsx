"use client";

import { useState } from "react";

export default function Composer({ onSend, currentUser }) {
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);

  async function handleSend() {
    if (!currentUser?._id) return alert("Please login again");
    if (!text.trim() && !pendingFile) return;

    await onSend({
      text,
      attachments: pendingFile ? [pendingFile] : [],
      location: null,
    });

    setText("");
    setPendingFile(null);
  }

  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setShowAttachMenu(false);

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const uploaded = await res.json().catch(() => null);

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

  function sendLocation() {
    if (!currentUser?._id) return alert("Please login again");

    setShowAttachMenu(false);

    navigator.geolocation.getCurrentPosition(async (pos) => {
      const lat = pos?.coords?.latitude;
      const lng = pos?.coords?.longitude;

      await onSend({
        text: "Shared location",
        attachments: [],
        location: {
          lat,
          lng,
          label: "My current location",
          mapUrl: `https://www.google.com/maps?q=${lat},${lng}`,
        },
      });
    });
  }

  return (
    <div className="bg-[#202c33] shrink-0 relative">
      {uploading && (
        <div className="px-4 py-3 border-b border-[#2a3942] flex items-center gap-3">
          <div className="w-6 h-6 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-white font-semibold">Uploading file...</p>
        </div>
      )}

      {pendingFile && !uploading && (
        <div className="px-4 py-3 border-b border-[#2a3942]">
          <div className="bg-[#111b21] rounded-2xl p-3 flex items-center gap-3">
            {pendingFile?.type === "image" ? (
              <img
                src={pendingFile?.url}
                className="w-14 h-14 rounded-xl object-cover"
                alt={pendingFile?.name}
              />
            ) : pendingFile?.type === "video" ? (
              <video
                src={pendingFile?.url}
                className="w-14 h-14 rounded-xl object-cover"
              />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-[#2a3942] flex items-center justify-center text-2xl">
                📄
              </div>
            )}

            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold truncate">{pendingFile?.name}</p>
              <p className="text-xs text-zinc-400">Ready to send</p>
            </div>

            <button
              onClick={() => setPendingFile(null)}
              className="w-8 h-8 rounded-full bg-red-500 text-white font-bold"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {showAttachMenu && (
        <div className="absolute bottom-20 left-4 w-56 bg-[#111b21] border border-[#2a3942] rounded-2xl shadow-xl z-50 overflow-hidden">
          <label className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#202c33] cursor-pointer">
            🖼️ Image / Video
            <input
              type="file"
              hidden
              disabled={uploading}
              onChange={handleFileUpload}
              accept="image/*,video/*"
            />
          </label>

          <label className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#202c33] cursor-pointer">
            📄 Document
            <input
              type="file"
              hidden
              disabled={uploading}
              onChange={handleFileUpload}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
            />
          </label>

          <label className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#202c33] cursor-pointer">
            🎧 Audio
            <input
              type="file"
              hidden
              disabled={uploading}
              onChange={handleFileUpload}
              accept="audio/*"
            />
          </label>

          <button
            onClick={sendLocation}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#202c33]"
          >
            📍 Location
          </button>
        </div>
      )}

      <footer className="min-h-16 px-2 sm:px-4 py-3 flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={() => setShowAttachMenu((prev) => !prev)}
          disabled={uploading}
          className="w-11 h-11 shrink-0 rounded-full bg-[#2a3942] flex items-center justify-center text-xl"
        >
          ＋
        </button>

        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !uploading) handleSend();
          }}
          disabled={uploading}
          placeholder={pendingFile ? "Add a caption..." : "Type a message"}
          className="flex-1 min-w-0 bg-[#2a3942] rounded-xl px-4 py-3 outline-none disabled:opacity-60"
        />

        <button
          onClick={handleSend}
          disabled={uploading}
          className="w-11 h-11 shrink-0 bg-emerald-500 rounded-5 text-black font-black rounded-full disabled:opacity-60"
        >
          ➤
        </button>
      </footer>
    </div>
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