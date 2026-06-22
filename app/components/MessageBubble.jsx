"use client";

import { useEffect, useRef, useState } from "react";
import {
  FaEllipsisV,
  FaFileAlt,
  FaMapMarkerAlt,
  FaTrashAlt,
} from "react-icons/fa";

export default function MessageBubble({
  message,
  isOwnMessage,
  onDeleteMessage,
  onPreviewImage,
}) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  const senderName = isOwnMessage ? "You" : message?.sender?.name || "User";
  const isDeleted = message?.deletedForEveryone;
  const longPressTimerRef = useRef(null);

function handleLongPressStart() {
  if (!isOwnMessage || isDeleted) return;

  longPressTimerRef.current = setTimeout(() => {
    setShowMenu(true);
  }, 550);
}

function handleLongPressEnd() {
  if (longPressTimerRef.current) {
    clearTimeout(longPressTimerRef.current);
  }
}

  useEffect(() => {
    function handleOutsideClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, []);

  return (
    <div
      className={`d-flex mb-2 px-2 ${isOwnMessage ? "justify-content-end" : "justify-content-start"}`}
    >
<div
  className="position-relative rounded-4 shadow-sm px-3 py-2 message-bubble-card"
  onTouchStart={handleLongPressStart}
  onTouchEnd={handleLongPressEnd}
  onTouchCancel={handleLongPressEnd}
  onMouseDown={handleLongPressStart}
  onMouseUp={handleLongPressEnd}
  onMouseLeave={handleLongPressEnd}
  style={{
    maxWidth: "min(78%, 520px)",
    background: isOwnMessage ? "#005c4b" : "#202c33",
    color: "#fff",
    borderTopRightRadius: isOwnMessage ? "6px" : "18px",
    borderTopLeftRadius: isOwnMessage ? "18px" : "6px",
  }}
>
        {isOwnMessage && !isDeleted && (
          <div ref={menuRef}>
            <button
              type="button"
              onClick={() => setShowMenu((prev) => !prev)}
              className="btn btn-sm text-white border-0 p-0 position-absolute opacity-75"
              style={{ top: 8, right: 10 }}
            >
              <FaEllipsisV size={12} />
            </button>

            {showMenu && (
              <div
                className="position-absolute top-100 end-0 mt-2 bg-dark border border-secondary rounded-4 shadow-lg overflow-hidden"
                style={{ width: 220, zIndex: 9999 }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onDeleteMessage(message?._id, "everyone");
                  }}
                  className="btn btn-dark w-100 text-start border-0 rounded-0 px-3 py-3 text-danger d-flex align-items-center gap-2"
                >
                  <FaTrashAlt />
                  <span className="small fw-semibold">Delete for everyone</span>
                </button>
              </div>
            )}
          </div>
        )}

        <div className="fw-bold small text-success mb-1 pe-4">{senderName}</div>

        {isDeleted ? (
          <div className="fst-italic text-light opacity-75 small">
            This message was deleted
          </div>
        ) : (
          <>
            {message?.text && (
              <div
                className="pe-4 text-break"
                style={{ whiteSpace: "pre-wrap" }}
              >
                {message.text}
              </div>
            )}

            {message?.attachments?.map((file, index) => (
              <div key={`${file?.url || file?.name}-${index}`} className="mt-2">
                {file?.type === "image" && (
                  <img
                    src={file?.url}
                    alt=""
                    className="img-fluid rounded-4 cursor-pointer"
                    style={{
                      maxHeight: "300px",
                      cursor: "pointer",
                    }}
                    onClick={() => onPreviewImage(file?.url)}
                  />
                )}

                {file?.type === "video" && (
                  <video src={file?.url} controls className="w-100 rounded-4" />
                )}

                {file?.type === "audio" && (
                  <audio src={file?.url} controls className="w-100 mt-1" />
                )}

                {["pdf", "doc", "file"].includes(file?.type) && (
                  <a
                    href={file?.url}
                    target="_blank"
                    rel="noreferrer"
                    className="d-flex align-items-center gap-2 bg-dark bg-opacity-50 rounded-4 p-3 text-white text-decoration-none"
                  >
                    <FaFileAlt className="text-success" />
                    <span className="text-truncate">
                      {file?.name || "File"}
                    </span>
                  </a>
                )}
              </div>
            ))}

            {message?.location?.mapUrl && (
              <a
                href={message?.location?.mapUrl}
                target="_blank"
                rel="noreferrer"
                className="d-flex align-items-center gap-2 mt-2 text-success fw-bold text-decoration-none"
              >
                <FaMapMarkerAlt />
                Open Location
              </a>
            )}
          </>
        )}

        <div
          className="text-end mt-1 small"
          style={{ fontSize: 10, color: "#d8d8d8" }}
        >
          {message?.createdAt
            ? new Date(message.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : ""}
          {isOwnMessage && !isDeleted && " ✓✓"}
        </div>
      </div>
    </div>
  );
}
