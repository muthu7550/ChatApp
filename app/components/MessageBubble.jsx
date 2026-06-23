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
  const longPressTimerRef = useRef(null);

  const senderName = isOwnMessage ? "You" : message?.sender?.name || "Sunday AI";
  const isDeleted = message?.deletedForEveryone;

  function handleLongPressStart() {
    if (!isOwnMessage || isDeleted) return;
    longPressTimerRef.current = setTimeout(() => setShowMenu(true), 550);
  }

  function handleLongPressEnd() {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
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
    <div className={`sunday-message-row ${isOwnMessage ? "own" : "other"}`}>
      {!isOwnMessage && <div className="sunday-ai-dot">✦</div>}

      <div
        className={`sunday-bubble ${isOwnMessage ? "own" : "other"}`}
        onTouchStart={handleLongPressStart}
        onTouchEnd={handleLongPressEnd}
        onTouchCancel={handleLongPressEnd}
        onMouseDown={handleLongPressStart}
        onMouseUp={handleLongPressEnd}
        onMouseLeave={handleLongPressEnd}
      >
        {isOwnMessage && !isDeleted && (
          <div ref={menuRef} className="message-menu-wrap">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu((prev) => !prev);
              }}
              className="bubble-menu-btn"
            >
              <FaEllipsisV size={11} />
            </button>

            {showMenu && (
              <div className="message-delete-popover">
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onDeleteMessage(message?._id, "everyone");
                  }}
                >
                  <FaTrashAlt size={14} />
                  Delete for everyone
                </button>
              </div>
            )}
          </div>
        )}

        <div className="bubble-sender">{senderName}</div>

        {isDeleted ? (
          <div className="bubble-deleted">This message was deleted</div>
        ) : (
          <>
            {message?.text && <div className="bubble-text">{message.text}</div>}

            {message?.attachments?.map((file, index) => (
              <div key={`${file?.url || file?.name}-${index}`} className="mt-2">
                {file?.type === "image" && (
                  <img
                    src={file?.url}
                    alt=""
                    className="bubble-image"
                    onClick={() => onPreviewImage?.(file?.url)}
                  />
                )}

                {file?.type === "video" && (
                  <video src={file?.url} controls className="bubble-video" />
                )}

                {file?.type === "audio" && (
                  <audio src={file?.url} controls className="w-100 mt-1" />
                )}

                {["pdf", "doc", "file"].includes(file?.type) && (
                  <a
                    href={file?.url}
                    target="_blank"
                    rel="noreferrer"
                    className="bubble-file"
                  >
                    <FaFileAlt />
                    <span>{file?.name || "File"}</span>
                  </a>
                )}
              </div>
            ))}

            {message?.location?.mapUrl && (
              <a
                href={message.location.mapUrl}
                target="_blank"
                rel="noreferrer"
                className="bubble-location"
              >
                <FaMapMarkerAlt />
                Open Location
              </a>
            )}
          </>
        )}

        <div className="bubble-time">
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