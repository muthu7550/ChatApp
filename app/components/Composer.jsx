"use client";

import { useEffect, useRef, useState } from "react";
import {
  FaFileAlt,
  FaImage,
  FaLocationArrow,
  FaMicrophone,
  FaPaperPlane,
  FaPlus,
  FaTimes,
} from "react-icons/fa";

export default function Composer({ onSend, currentUser, onFocusInput  }) {
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);

  const attachRef = useRef(null);

  useEffect(() => {
    function handleOutsideClick(e) {
      if (attachRef.current && !attachRef.current.contains(e.target)) {
        setShowAttachMenu(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, []);

  async function handleSend() {
    if (!currentUser?._id) return alert("Please login again");
    if (!text.trim() && !pendingFile) return;

    await onSend({
      text: text.trim(),
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
    <div className="bg-[#202c33] border-top border-secondary position-relative">
      {uploading && (
        <div className="px-3 px-sm-4 py-3 d-flex align-items-center gap-3 border-bottom border-secondary">
          <div className="spinner-border spinner-border-sm text-success" />
          <span className="small fw-semibold text-white">Uploading file...</span>
        </div>
      )}

      {pendingFile && !uploading && (
        <div className="px-3 px-sm-4 py-3 border-bottom border-secondary">
          <div className="bg-[#111b21] rounded-4 p-3 d-flex align-items-center gap-3 shadow-sm">
            {pendingFile?.type === "image" ? (
              <img
                src={pendingFile?.url}
                className="rounded-3 object-fit-cover"
                width="58"
                height="58"
                alt={pendingFile?.name}
              />
            ) : pendingFile?.type === "video" ? (
              <video
                src={pendingFile?.url}
                className="rounded-3 object-fit-cover"
                width="58"
                height="58"
              />
            ) : (
              <div
                className="rounded-3 bg-dark d-flex align-items-center justify-content-center"
                style={{ width: 58, height: 58 }}
              >
                <FaFileAlt className="text-success fs-4" />
              </div>
            )}

            <div className="flex-grow-1 overflow-hidden">
              <div className="fw-bold text-white text-truncate">
                {pendingFile?.name}
              </div>
              <small className="text-secondary">Ready to send</small>
            </div>

            <button
              type="button"
              onClick={() => setPendingFile(null)}
              className="btn btn-danger rounded-circle d-flex align-items-center justify-content-center"
              style={{ width: 34, height: 34 }}
            >
              <FaTimes size={13} />
            </button>
          </div>
        </div>
      )}

      <div ref={attachRef}>
        {showAttachMenu && (
          <div
            className="position-absolute start-0 bottom-100 ms-2 ms-sm-4 mb-2 bg-dark border border-secondary rounded-4 shadow-lg overflow-hidden"
            style={{ width: 240, zIndex: 9999 }}
          >
            <AttachItem icon={<FaImage />} label="Image / Video" accept="image/*,video/*" onChange={handleFileUpload} disabled={uploading} />
            <AttachItem icon={<FaFileAlt />} label="Document" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt" onChange={handleFileUpload} disabled={uploading} />
            <AttachItem icon={<FaMicrophone />} label="Audio" accept="audio/*" onChange={handleFileUpload} disabled={uploading} />

            <button
              type="button"
              onClick={sendLocation}
              className="btn btn-dark w-100 border-0 rounded-0 text-start px-4 py-3 d-flex align-items-center gap-3"
            >
              <FaLocationArrow className="text-success" />
              <span>Location</span>
            </button>
          </div>
        )}

        <footer className="px-2 px-sm-4 py-2 py-sm-3 d-flex align-items-end gap-2">
          <button
            type="button"
            onClick={() => setShowAttachMenu((prev) => !prev)}
            disabled={uploading}
            className="btn btn-dark rounded-circle flex-shrink-0 d-flex align-items-center justify-content-center"
            style={{ width: 44, height: 44 }}
          >
            <FaPlus />
          </button>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !uploading) {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={uploading}
            rows={1}
            placeholder={pendingFile ? "Add a caption..." : "Type a message"}
            className="form-control bg-dark text-white border-secondary rounded-4 px-3 py-2 flex-grow-1"
            style={{ resize: "none", minHeight: 44, maxHeight: 110 }}
          />

          <button
            type="button"
            onClick={handleSend}
            disabled={uploading}
            className="btn btn-success rounded-circle flex-shrink-0 d-flex align-items-center justify-content-center"
            style={{ width: 44, height: 44 }}
          >
            <FaPaperPlane />
          </button>
        </footer>
      </div>
    </div>
  );
}

function AttachItem({ icon, label, accept, onChange, disabled }) {
  return (
    <label className="btn btn-dark w-100 border-0 rounded-0 text-start px-4 py-3 d-flex align-items-center gap-3">
      <span className="text-success">{icon}</span>
      <span>{label}</span>
      <input type="file" hidden disabled={disabled} onChange={onChange} accept={accept} onFocus={onFocusInput} />
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