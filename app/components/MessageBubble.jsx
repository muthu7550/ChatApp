"use client";

import { useState } from "react";

export default function MessageBubble({
  message,
  isOwnMessage,
  onDeleteMessage,
}) {
  const [showMenu, setShowMenu] = useState(false);

  const senderName = isOwnMessage
    ? "You"
    : message?.sender?.name || "User";

  const isDeleted = message?.deletedForEveryone;

  return (
    <div
      className={`d-flex ${
        isOwnMessage ? "justify-content-end" : "justify-content-start"
      }`}
    >
      <div
        className={`position-relative px-3 py-2 rounded-4 shadow-sm`}
        style={{
          maxWidth: "75%",
          background: isOwnMessage ? "#005c4b" : "#202c33",
          color: "#fff",
        }}
      >
        {/* SHOW MENU ONLY FOR OWN MESSAGE */}
        {isOwnMessage && !isDeleted && (
          <button
            type="button"
            onClick={() => setShowMenu((prev) => !prev)}
            className="btn btn-sm text-white border-0 p-0 position-absolute"
            style={{
              top: 8,
              right: 10,
            }}
          >
            ⋮
          </button>
        )}

        {/* MENU */}
        {isOwnMessage && showMenu && !isDeleted && (
          <div
            className="position-absolute top-100 end-0 mt-2 bg-dark border border-secondary rounded-4 shadow-lg overflow-hidden"
            style={{
              width: "220px",
              zIndex: 9999,
            }}
          >

            <hr className="m-0 border-secondary" />

            <button
              type="button"
              onClick={() => {
                setShowMenu(false);
                onDeleteMessage(message?._id, "everyone");
              }}
              className="btn btn-dark w-100 text-start border-0 rounded-0 px-3 py-3 text-danger"
            >
              <div className="fw-semibold">
                ❌ Delete for everyone
              </div>
            </button>
          </div>
        )}

        {/* SENDER */}
        <div className="fw-bold small text-success mb-1 pe-4">
          {senderName}
        </div>

        {/* DELETED MESSAGE */}
        {isDeleted ? (
          <div className="fst-italic text-light opacity-75">
            This message was deleted
          </div>
        ) : (
          <>
            {message?.text && (
              <div className="pe-4">
                {message?.text}
              </div>
            )}

            {message?.attachments?.map((file, index) => (
              <div key={index} className="mt-2">
                {file?.type === "image" && (
                  <img
                    src={file?.url}
                    alt=""
                    className="img-fluid rounded"
                  />
                )}

                {file?.type === "video" && (
                  <video
                    src={file?.url}
                    controls
                    className="w-100 rounded"
                  />
                )}

                {file?.type === "audio" && (
                  <audio
                    src={file?.url}
                    controls
                    className="w-100"
                  />
                )}

                {["pdf", "doc", "file"].includes(file?.type) && (
                  <a
                    href={file?.url}
                    target="_blank"
                    rel="noreferrer"
                    className="d-block text-white text-decoration-none"
                  >
                    📄 {file?.name}
                  </a>
                )}
              </div>
            ))}

            {message?.location?.mapUrl && (
              <a
                href={message?.location?.mapUrl}
                target="_blank"
                rel="noreferrer"
                className="d-block mt-2 text-success fw-bold"
              >
                📍 Open Location
              </a>
            )}
          </>
        )}

        <div
          className="text-end mt-1"
          style={{
            fontSize: "10px",
            color: "#ddd",
          }}
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