"use client";

import { useState } from "react";

export default function MessageBubble({
  message,
  isOwnMessage,
  onDeleteMessage,
}) {
  const [showMenu, setShowMenu] = useState(false);

  const senderName = isOwnMessage ? "You" : message?.sender?.name || "User";
  const isDeleted = message?.deletedForEveryone;
  
  return (
    <div className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}>
      <div
        className={`relative max-w-[75%] md:max-w-md rounded-2xl px-4 py-3 shadow ${
          isOwnMessage
            ? "bg-[#005c4b] text-white rounded-tr-sm"
            : "bg-[#202c33] text-white rounded-tl-sm"
        }`}
      >
        {!isDeleted && (
          <button
            onClick={() => setShowMenu((prev) => !prev)}
            className="absolute top-2 right-2 text-zinc-300 hover:text-white"
          >
            ⋮
          </button>
        )}

       {showMenu && !isDeleted && (
  <div
    className="position-absolute top-100 end-0 mt-2 bg-dark border border-secondary rounded-4 shadow-lg overflow-hidden"
    style={{
      width: "230px",
      zIndex: 9999,
    }}
  >
    <button
      type="button"
      onClick={() => {
        setShowMenu(false);
        onDeleteMessage(message?._id, "me");
      }}
      className="btn w-100 text-start text-white border-0 rounded-0 px-3 py-2 d-flex align-items-start gap-3"
    >
      <span className="fs-6">🗑</span>

      <span>
        <span className="d-block fw-semibold small">
          Delete for me
        </span>
      </span>
    </button>

    {isOwnMessage && (
      <>
        <div className="border-secondary opacity-50" />

        <button
          type="button"
          onClick={() => {
            setShowMenu(false);
            onDeleteMessage(message?._id, "everyone");
          }}
          className="btn w-100 text-start border-0 rounded-0 px-3 py-2 d-flex align-items-start gap-3 text-danger"
        >
          <span className="fs-6">❌</span>

          <span>
            <span className="d-block fw-semibold small">
              Delete for everyone
            </span>
          </span>
        </button>
      </>
    )}
  </div>
)}

        <p className="text-xs font-bold mb-1 text-emerald-300 pr-6">
          {senderName}
        </p>

        {isDeleted ? (
          <p className="italic text-zinc-300">
             This message was deleted
          </p>
        ) : (
          <>
            {message?.text && (
              <p className="whitespace-pre-wrap pr-5">{message?.text}</p>
            )}

            {message?.attachments?.map((file, index) => (
              <div key={index} className="mt-3">
                {file?.type === "image" && (
                  <img
                    src={file?.url}
                    alt={file?.name}
                    className="rounded-xl"
                  />
                )}

                {file?.type === "video" && (
                  <video
                    src={file?.url}
                    controls
                    className="rounded-xl w-full"
                  />
                )}

                {file?.type === "audio" && (
                  <audio src={file?.url} controls className="w-full" />
                )}

                {["pdf", "doc", "file"].includes(file?.type) && (
                  <a
                    href={file?.url}
                    target="_blank"
                    className="flex items-center gap-2 bg-black/20 p-3 rounded-xl"
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
                className="block mt-2 underline font-bold text-emerald-300"
              >
                📍 Open Location
              </a>
            )}
          </>
        )}

        <p className="text-[10px] text-right text-zinc-300 mt-1 m-0">
          {message?.createdAt
            ? new Date(message?.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : ""}{" "}
          {isOwnMessage && !isDeleted ? "✓✓" : ""}
        </p>
      </div>
    </div>
  );
}