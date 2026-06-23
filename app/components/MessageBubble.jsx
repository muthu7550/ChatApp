"use client";

import { useEffect, useRef, useState } from "react";
import {
  FaEllipsisV,
  FaFileAlt,
  FaMapMarkerAlt,
  FaTrashAlt,
  FaDownload,
  FaMicrophone,
  FaImage,
  FaVideo,
  FaCheckDouble,
  FaExternalLinkAlt,
  FaEye,
} from "react-icons/fa";

const ORANGE_GRADIENT = "linear-gradient(135deg, #ff9d2e, #ff5b2f)";

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
      {!isOwnMessage && (
        <div
          className="rounded-circle d-flex align-items-center justify-content-center text-white flex-shrink-0"
          style={{
            width: 30,
            height: 30,
            background: ORANGE_GRADIENT,
            fontSize: 13,
            boxShadow: "0 8px 20px rgba(255,91,47,.25)",
          }}
        >
          ✦
        </div>
      )}

      <div
        className={`message-bubble-pro ${isOwnMessage ? "own" : "other"}`}
        onTouchStart={handleLongPressStart}
        onTouchEnd={handleLongPressEnd}
        onTouchCancel={handleLongPressEnd}
        onMouseDown={handleLongPressStart}
        onMouseUp={handleLongPressEnd}
        onMouseLeave={handleLongPressEnd}
      >
        <style>{`
          .message-bubble-pro {
            position: relative;
            max-width: min(76%, 560px);
            padding: 12px 14px 9px;
            border-radius: 22px;
            box-shadow: 0 10px 25px rgba(15, 23, 42, 0.08);
            word-break: break-word;
          }

          .message-bubble-pro.own {
            background: linear-gradient(135deg, #ff9d2e, #ff5b2f);
            color: #ffffff;
            border-bottom-right-radius: 8px;
          }

          .message-bubble-pro.other {
            background: #ffffff;
            color: #111827;
            border: 1px solid #f1f1f1;
            border-bottom-left-radius: 8px;
          }

          .bubble-sender-pro {
            font-size: 11px;
            font-weight: 800;
            margin-bottom: 4px;
            opacity: .85;
          }

          .bubble-text-pro {
            font-size: 15px;
            line-height: 1.45;
            white-space: pre-wrap;
          }

          .bubble-time-pro {
            margin-top: 7px;
            font-size: 10.5px;
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: 4px;
            opacity: .78;
          }

          .message-menu-wrap {
            position: absolute;
            top: 8px;
            right: 8px;
            z-index: 3;
          }

          .bubble-menu-btn {
            width: 25px;
            height: 25px;
            border: 0;
            border-radius: 999px;
            background: rgba(255,255,255,.22);
            color: inherit;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .bubble-menu-btn:hover {
            background: rgba(255,255,255,.35);
          }

          .message-delete-popover {
            position: absolute;
            right: 0;
            top: calc(100% + 8px);
            width: 210px;
            background: #ffffff;
            border: 1px solid #f1f1f1;
            border-radius: 18px;
            overflow: hidden;
            box-shadow: 0 18px 45px rgba(15, 23, 42, .18);
            z-index: 10;
          }

          .message-delete-popover button {
            width: 100%;
            border: 0;
            background: #ffffff;
            padding: 13px 15px;
            color: #dc2626;
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 13px;
            font-weight: 700;
          }

          .message-delete-popover button:hover {
            background: #fff1f2;
          }

          .bubble-deleted-pro {
            font-size: 14px;
            font-style: italic;
            opacity: .75;
          }

          .media-card {
            margin-top: 8px;
            overflow: hidden;
            border-radius: 18px;
            background: rgba(255,255,255,.16);
            border: 1px solid rgba(255,255,255,.2);
          }

          .message-bubble-pro.other .media-card {
            background: #f8fafc;
            border: 1px solid #eef2f7;
          }

          .bubble-image-pro,
          .bubble-video-pro {
            width: 100%;
            max-width: 330px;
            max-height: 320px;
            object-fit: cover;
            display: block;
            cursor: pointer;
          }

          .bubble-video-pro {
            background: #000;
          }

          .file-card-pro,
          .location-card-pro,
          .audio-card-pro {
            margin-top: 8px;
            border-radius: 18px;
            padding: 12px;
            display: flex;
            align-items: center;
            gap: 12px;
            color: inherit;
            background: rgba(255,255,255,.16);
            border: 1px solid rgba(255,255,255,.22);
          }

          .file-card-pro {
            flex-direction: column;
            align-items: stretch;
          }

          .message-bubble-pro.other .file-card-pro,
          .message-bubble-pro.other .location-card-pro,
          .message-bubble-pro.other .audio-card-pro {
            background: #f8fafc;
            border: 1px solid #eef2f7;
            color: #111827;
          }

          .file-main-row-pro {
            display: flex;
            align-items: center;
            gap: 12px;
            min-width: 0;
          }

          .file-icon-pro,
          .location-icon-pro,
          .audio-icon-pro {
            width: 44px;
            height: 44px;
            border-radius: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            background: rgba(255,255,255,.24);
          }

          .message-bubble-pro.other .file-icon-pro,
          .message-bubble-pro.other .location-icon-pro,
          .message-bubble-pro.other .audio-icon-pro {
            background: #fff3eb;
            color: #ff5b2f;
          }

          .file-title-pro,
          .location-title-pro {
            font-size: 13px;
            font-weight: 800;
          }

          .file-subtitle-pro,
          .location-subtitle-pro {
            font-size: 11px;
            opacity: .75;
          }

          .audio-card-pro audio {
            height: 38px;
            max-width: 230px;
          }

          .file-actions-pro {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            margin-top: 10px;
          }

          .file-action-btn-pro {
            text-decoration: none;
            border: 0;
            border-radius: 999px;
            padding: 8px 12px;
            font-size: 12px;
            font-weight: 800;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: rgba(255,255,255,.22);
            color: inherit;
          }

          .file-action-btn-pro.primary {
            background: #ffffff;
            color: #ff5b2f;
          }

          .message-bubble-pro.other .file-action-btn-pro {
            background: #ffffff;
            color: #475569;
          }

          .message-bubble-pro.other .file-action-btn-pro.primary {
            background: linear-gradient(135deg, #ff9d2e, #ff5b2f);
            color: #ffffff;
          }

          .download-pill-pro {
            width: 32px;
            height: 32px;
            border-radius: 999px;
            background: rgba(255,255,255,.2);
            display: flex;
            align-items: center;
            justify-content: center;
            margin-left: auto;
            flex-shrink: 0;
            color: inherit;
            text-decoration: none;
          }

          .message-bubble-pro.other .download-pill-pro {
            background: #ffffff;
            color: #ff5b2f;
          }

          @media (max-width: 575px) {
            .message-bubble-pro {
              max-width: 86%;
            }

            .bubble-image-pro,
            .bubble-video-pro {
              max-width: 260px;
              max-height: 260px;
            }

            .audio-card-pro audio {
              max-width: 170px;
            }
          }
        `}</style>

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

        <div className="bubble-sender-pro">{senderName}</div>

        {isDeleted ? (
          <div className="bubble-deleted-pro">This message was deleted</div>
        ) : (
          <>
            {message?.text && (
              <div className="bubble-text-pro">{message.text}</div>
            )}

            {message?.attachments?.map((file, index) => (
              <AttachmentView
                key={`${file?.url || file?.name}-${index}`}
                file={file}
                onPreviewImage={onPreviewImage}
              />
            ))}

            {message?.location?.mapUrl && (
              <a
                href={message.location.mapUrl}
                target="_blank"
                rel="noreferrer"
                className="location-card-pro text-decoration-none"
              >
                <span className="location-icon-pro">
                  <FaMapMarkerAlt />
                </span>

                <span className="flex-grow-1 overflow-hidden">
                  <span className="location-title-pro d-block">
                    {message.location?.type === "live"
                      ? "Live Location"
                      : "Shared Location"}
                  </span>
                  <span className="location-subtitle-pro d-block">
                    {message.location?.type === "live"
                      ? `Expires in ${message.location?.durationHours || 1}h`
                      : "Open in Google Maps"}
                  </span>
                </span>

                <span className="download-pill-pro">
                  <FaExternalLinkAlt size={12} />
                </span>
              </a>
            )}
          </>
        )}

        <div className="bubble-time-pro">
          {message?.createdAt
            ? new Date(message.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : ""}
          {isOwnMessage && !isDeleted && <FaCheckDouble size={11} />}
        </div>
      </div>
    </div>
  );
}

function AttachmentView({ file, onPreviewImage }) {
  if (file?.type === "image") {
    return (
      <div className="media-card">
        <img
          src={file?.url}
          alt={file?.name || "image"}
          className="bubble-image-pro"
          onClick={() => onPreviewImage?.(file?.url)}
        />
      </div>
    );
  }

  if (file?.type === "video") {
    return (
      <div className="media-card">
        <video src={file?.url} controls className="bubble-video-pro" />
      </div>
    );
  }

  if (file?.type === "audio") {
    return (
      <div className="audio-card-pro">
        <span className="audio-icon-pro">
          <FaMicrophone />
        </span>

        <audio src={file?.url} controls />

        <a
          href={file?.url}
          download={file?.name || true}
          className="download-pill-pro"
          title="Download"
        >
          <FaDownload size={13} />
        </a>
      </div>
    );
  }

  const previewUrl = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(
    file?.url || ""
  )}`;

  return (
    <div className="file-card-pro">
      <div className="file-main-row-pro">
        <span className="file-icon-pro">
          <FaFileIcon file={file} />
        </span>

        <span className="flex-grow-1 overflow-hidden">
          <span className="file-title-pro d-block text-truncate">
            {file?.name || "Document"}
          </span>
          <span className="file-subtitle-pro d-block text-truncate">
            {file?.mimeType || "File"}
          </span>
        </span>
      </div>

      <div className="file-actions-pro">
        <a
          href={file?.url}
          target="_blank"
          rel="noreferrer"
          className="file-action-btn-pro primary"
        >
          <FaExternalLinkAlt size={11} />
          Open Browser
        </a>

        <a
          href={previewUrl}
          target="_blank"
          rel="noreferrer"
          className="file-action-btn-pro"
        >
          <FaEye size={12} />
          Preview
        </a>

        <a
          href={file?.url}
          download={file?.name || true}
          className="file-action-btn-pro"
        >
          <FaDownload size={12} />
          Download
        </a>
      </div>
    </div>
  );
}

function FaFileIcon({ file }) {
  if (file?.type === "video") return <FaVideo />;
  if (file?.type === "image") return <FaImage />;
  return <FaFileAlt />;
}