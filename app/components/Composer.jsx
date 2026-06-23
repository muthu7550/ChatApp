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
  FaExclamationTriangle,
} from "react-icons/fa";

const MAX_FILE_SIZE_MB = 4;
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;
const ORANGE_GRADIENT = "linear-gradient(135deg, #ff9d2e, #ff5b2f)";

export default function Composer({ onSend, currentUser }) {
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [largeFileError, setLargeFileError] = useState(null);

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

    const messageText = text.trim();

    setText("");

    await onSend({
      text: messageText,
      attachments: pendingFile ? [pendingFile] : [],
      location: null,
    });

    setPendingFile(null);
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
          transition: 0.18s ease;
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

        .attach-popover {
          width: 250px;
          z-index: 9999;
          background: #ffffff;
          border: 1px solid #f1f1f1;
          border-radius: 22px;
          box-shadow: 0 18px 50px rgba(15, 23, 42, 0.18);
          overflow: hidden;
        }

        .attach-popover::after {
          content: "";
          position: absolute;
          bottom: -7px;
          left: 24px;
          width: 14px;
          height: 14px;
          background: #ffffff;
          transform: rotate(45deg);
          border-right: 1px solid #f1f1f1;
          border-bottom: 1px solid #f1f1f1;
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

        .pending-card {
          background: #fff7f1;
          border: 1px solid #ffe0cf;
          border-radius: 22px;
        }

        .error-modal-card {
          background: #ffffff;
          color: #111827;
          border-radius: 26px;
          box-shadow: 0 24px 70px rgba(0,0,0,.25);
        }
      `}</style>

      {largeFileError && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center px-3"
          style={{
            background: "rgba(0,0,0,0.45)",
            backdropFilter: "blur(6px)",
            zIndex: 99999,
          }}
        >
          <div
            className="error-modal-card text-center p-4"
            style={{
              width: "100%",
              maxWidth: 420,
            }}
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

      {uploading && (
        <div className="px-3 px-sm-4 py-3 d-flex align-items-center gap-3 border-bottom bg-white">
          <div
            className="spinner-border spinner-border-sm"
            style={{ color: "#ff5b2f" }}
          />
          <span className="small fw-semibold text-secondary">
            Uploading file...
          </span>
        </div>
      )}

      {pendingFile && !uploading && (
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
              style={{
                width: 34,
                height: 34,
                background: "#ef4444",
              }}
            >
              <FaTimes size={13} />
            </button>
          </div>
        </div>
      )}

      <div ref={attachRef} className="position-relative">
        {showAttachMenu && (
          <div className="attach-popover position-absolute start-0 bottom-100 ms-2 ms-sm-4 mb-3">
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
              label="Audio"
              accept="audio/*"
              onChange={handleFileUpload}
              disabled={uploading}
            />

            <button
              type="button"
              onClick={sendLocation}
              className="attach-item d-flex align-items-center gap-3 text-start"
            >
              <span className="attach-icon">
                <FaLocationArrow />
              </span>
              <span>Location</span>
            </button>
          </div>
        )}

        <footer className="px-2 px-sm-4 py-3 d-flex align-items-end gap-2">
          <button
            type="button"
            onClick={() => setShowAttachMenu((prev) => !prev)}
            disabled={uploading}
            className="composer-icon-btn flex-shrink-0 d-flex align-items-center justify-content-center"
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
            className="form-control composer-input px-4 py-2 flex-grow-1"
          />

          <button
            type="button"
            onClick={handleSend}
            disabled={!pendingFile && !text.trim()}
            className="composer-send-btn flex-shrink-0 d-flex align-items-center justify-content-center"
          >
            <FaPaperPlane size={15} />
          </button>
        </footer>
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