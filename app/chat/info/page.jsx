"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FaArrowLeft,
  FaBan,
  FaBell,
  FaFileAlt,
  FaImage,
  FaLink,
  FaSearch,
  FaTrashAlt,
  FaUsers,
  FaVideo,
  FaPhoneAlt,
  FaComments,
  FaRegImages,
  FaUserShield,
} from "react-icons/fa";
import CreateGroupModal from "../../components/CreateGroupModal";

const ORANGE = "linear-gradient(135deg, #ff9d2e, #ff5b2f)";

export default function ChatInfoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const conversationId = searchParams.get("conversationId");

  const [currentUser, setCurrentUser] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [activeTab, setActiveTab] = useState("media");
  const [loading, setLoading] = useState(true);
  const [showGroupModal, setShowGroupModal] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    setCurrentUser(user);
  }, []);

  useEffect(() => {
    if (!conversationId || !currentUser?._id) return;
    loadInfo();
  }, [conversationId, currentUser?._id]);

  async function loadInfo() {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const convRes = await fetch(
        `/api/conversations?userId=${currentUser._id}`,
        { headers: { Authorization: token ? `Bearer ${token}` : "" } }
      );

      const convResult = await convRes.json();
      const found = convResult?.conversations?.find(
        (item) => item?._id === conversationId
      );

      setConversation(found || null);

      const msgRes = await fetch(
        `/api/messages?conversationId=${conversationId}&userId=${currentUser._id}`,
        { headers: { Authorization: token ? `Bearer ${token}` : "" } }
      );

      const msgResult = await msgRes.json();
      setMessages(msgResult?.messages || []);
    } catch (error) {
      console.error("Load chat info error:", error);
    } finally {
      setLoading(false);
    }
  }

  const otherPerson = useMemo(() => {
    if (!conversation || conversation?.type === "group") return null;
    return conversation?.members?.find(
      (member) => member?._id !== currentUser?._id
    );
  }, [conversation, currentUser?._id]);

  const title =
    conversation?.type === "group"
      ? conversation?.name || "Group"
      : otherPerson?.name || "User";

  const avatar =
    conversation?.image ||
    otherPerson?.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      title || "User"
    )}&background=ff6b2c&color=ffffff&bold=true`;

  const media = [];
  const docs = [];
  const links = [];

  messages.forEach((message) => {
    message?.attachments?.forEach((file) => {
      if (file?.type === "image" || file?.type === "video") media.push(file);
      else docs.push(file);
    });

    const foundLinks = message?.text?.match?.(/(https?:\/\/[^\s]+)/g) || [];
    foundLinks.forEach((link) => links.push({ url: link, text: message?.text }));
  });

  async function clearChat() {
    const ok = confirm("Clear this chat for you?");
    if (!ok) return;

    const token = localStorage.getItem("token");

    await fetch(
      `/api/conversations?conversationId=${conversationId}&userId=${currentUser?._id}`,
      {
        method: "DELETE",
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      }
    );

    router.replace("/chat");
  }

  if (loading) {
    return (
      <main className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <div className="spinner-border" style={{ color: "#ff5b2f" }} />
      </main>
    );
  }

  return (
    <main className="info-page min-vh-100">
      <style>{`
      .info-page {
  min-height: 100vh;
  height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
  background:
    radial-gradient(circle at top left, rgba(255,157,46,.22), transparent 34%),
    radial-gradient(circle at top right, rgba(255,91,47,.16), transparent 30%),
    #f8fafc;
  color: #111827;
}

        .top-bar {
          position: sticky;
          top: 0;
          z-index: 100;
          backdrop-filter: blur(18px);
          background: rgba(255,255,255,.88);
          border-bottom: 1px solid rgba(226,232,240,.9);
        }

        .hero-card {
          border-radius: 32px;
          overflow: hidden;
          background: #ffffff;
          box-shadow: 0 24px 70px rgba(15,23,42,.10);
          border: 1px solid rgba(255,217,199,.9);
        }

        .hero-cover {
          height: 150px;
          background:
            radial-gradient(circle at 16% 10%, rgba(255,255,255,.58), transparent 18%),
            radial-gradient(circle at 80% 25%, rgba(255,255,255,.32), transparent 24%),
            linear-gradient(135deg, #ff9d2e, #ff5b2f);
        }

        .avatar-wrap {
          width: 132px;
          height: 132px;
          margin-top: -66px;
          padding: 5px;
          border-radius: 999px;
          background: #ffffff;
          box-shadow: 0 20px 48px rgba(255,91,47,.28);
        }

        .info-avatar {
          width: 100%;
          height: 100%;
          border-radius: 999px;
          object-fit: cover;
        }

        .quick-btn {
          border: 0;
          border-radius: 22px;
          background: #fff7f1;
          color: #ff5b2f;
          padding: 14px 12px;
          font-weight: 900;
          transition: .18s ease;
        }

        .quick-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 16px 34px rgba(255,91,47,.16);
        }

        .soft-card {
          background: #ffffff;
          border: 1px solid #eef2f7;
          border-radius: 26px;
          box-shadow: 0 16px 38px rgba(15,23,42,.06);
        }

        .section-title {
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: .08em;
          color: #94a3b8;
          font-weight: 900;
        }

        .tab-pill {
          border: 0;
          border-radius: 999px;
          padding: 11px 16px;
          font-weight: 900;
          background: #f1f5f9;
          color: #64748b;
        }

        .tab-pill.active {
          color: white;
          background: ${ORANGE};
          box-shadow: 0 12px 26px rgba(255,91,47,.22);
        }

        .shared-card {
  overflow: hidden;
}

.shared-tab-scroll {
  overflow-x: auto;
  overflow-y: hidden;
  padding-bottom: 4px;
}

.shared-tab-scroll::-webkit-scrollbar {
  height: 0;
}

.shared-tab-row {
  display: flex;
  flex-wrap: nowrap;
  gap: 10px;
  min-width: max-content;
}

.tab-pill {
  white-space: nowrap;
  flex-shrink: 0;
}

.shared-content-area {
  min-height: 260px;
}

.shared-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.shared-list-item {
  background: #f8fafc;
  border: 1px solid #eef2f7;
  border-radius: 18px;
  padding: 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: 0.18s ease;
}

.shared-list-item:hover {
  background: #fff7f1;
  transform: translateY(-1px);
}

.members-list {
  max-height: 430px;
  overflow-y: auto;
  padding-right: 4px;
}

.member-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px;
  border-radius: 18px;
  transition: 0.18s ease;
}

.member-row:hover {
  background: #fff7f1;
}

@media (max-width: 576px) {
  .shared-search-btn {
    width: 42px;
    height: 42px;
    padding: 0 !important;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .shared-search-btn .me-2 {
    margin-right: 0 !important;
  }

  .shared-search-btn {
    font-size: 0;
  }

  .shared-search-btn svg {
    font-size: 14px;
  }
}

        .media-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }

        .media-tile {
          aspect-ratio: 1;
          border-radius: 20px;
          overflow: hidden;
          background: #f1f5f9;
          position: relative;
        }

        .media-tile img,
        .media-tile video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .media-video-badge {
          position: absolute;
          right: 10px;
          top: 10px;
          width: 30px;
          height: 30px;
          border-radius: 999px;
          background: rgba(0,0,0,.55);
          color: white;
          display: grid;
          place-items: center;
        }

        .option-row {
          width: 100%;
          border: 0;
          background: #ffffff;
          padding: 17px 18px;
          display: flex;
          align-items: center;
          gap: 14px;
          text-align: left;
          border-bottom: 1px solid #f1f5f9;
        }

        .option-row:last-child {
          border-bottom: 0;
        }

        .option-row:hover {
          background: #fff7f1;
        }

        .option-icon {
          width: 44px;
          height: 44px;
          border-radius: 16px;
          display: grid;
          place-items: center;
          background: #fff3eb;
          color: #ff5b2f;
          flex-shrink: 0;
        }

        .danger-row {
          color: #dc2626 !important;
        }

        .danger-row .option-icon {
          color: #dc2626;
          background: #fee2e2;
        }

        .empty-box {
          min-height: 180px;
          display: grid;
          place-items: center;
          text-align: center;
          background: #f8fafc;
          border-radius: 22px;
          border: 1px dashed #cbd5e1;
        }

        @media (max-width: 991px) {
          .media-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (max-width: 576px) {
          .hero-cover {
            height: 120px;
          }

          .avatar-wrap {
            width: 108px;
            height: 108px;
            margin-top: -54px;
          }

          .media-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .hero-card {
            border-radius: 0 0 30px 30px;
          }
        }
      `}</style>

      <header className="top-bar px-3 py-3">
        <div className="container d-flex align-items-center gap-3" style={{ maxWidth: 1100 }}>
          <button
            type="button"
            onClick={() => router.back()}
            className="btn rounded-circle bg-light border-0 d-flex align-items-center justify-content-center"
            style={{ width: 42, height: 42 }}
          >
            <FaArrowLeft />
          </button>

          <div className="min-w-0">
            <h6 className="mb-0 fw-bold text-truncate">
              {conversation?.type === "group" ? "Group info" : "Contact info"}
            </h6>
            <small className="text-secondary text-truncate d-block">{title}</small>
          </div>
        </div>
      </header>

    <section
  className="container py-3 py-sm-4 pb-5"
  style={{ maxWidth: 1100 }}
>
        <div className="row g-4">
          <div className="col-12 col-lg-4">
            <div className="hero-card text-center mb-4">
              <div className="hero-cover" />

              <div className="px-4 pb-4">
                <div className="avatar-wrap mx-auto">
                  <img src={avatar} alt={title} className="info-avatar" />
                </div>

                <h3 className="fw-bold mt-3 mb-1 text-truncate">{title}</h3>

                <p className="text-secondary mb-3 text-truncate">
                  {conversation?.type === "group"
                    ? `${conversation?.members?.length || 0} members`
                    : otherPerson?.email || "Private chat"}
                </p>

                <div className="row g-2">
                  <div className="col-4">
                    <button className="quick-btn w-100">
                      <FaPhoneAlt className="d-block mx-auto mb-2" />
                      Audio
                    </button>
                  </div>
                  <div className="col-4">
                    <button className="quick-btn w-100">
                      <FaVideo className="d-block mx-auto mb-2" />
                      Video
                    </button>
                  </div>
                  <div className="col-4">
                    <button
                      className="quick-btn w-100"
                      onClick={() => router.push(`/chat?conversationId=${conversationId}`)}
                    >
                      <FaComments className="d-block mx-auto mb-2" />
                      Chat
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="soft-card p-4 mb-4">
              <div className="section-title mb-2">About</div>
              <div className="fw-semibold">
                {conversation?.type === "group"
                  ? conversation?.description || "Group created in ChatterBox."
                  : "Hey there! I am using ChatterBox."}
              </div>
            </div>

            <div className="soft-card overflow-hidden mb-4">
             <button
  type="button"
  className="option-row"
  onClick={() => setShowGroupModal(true)}
>
  <span className="option-icon">
    <FaUsers />
  </span>
  <span>
    <span className="d-block fw-bold">Create group with {title}</span>
    <small className="text-secondary">Add more people to this chat</small>
  </span>
</button>

              {conversation?.type !== "group" && (
                <button className="option-row">
                  <span className="option-icon"><FaUsers /></span>
                  <span>
                    <span className="d-block fw-bold">Create group with {title}</span>
                    <small className="text-secondary">Add more people to this chat</small>
                  </span>
                </button>
              )}

              <button className="option-row">
                <span className="option-icon"><FaUserShield /></span>
                <span>
                  <span className="d-block fw-bold">Encryption</span>
                  <small className="text-secondary">Messages stay private</small>
                </span>
              </button>
            </div>

            <div className="soft-card overflow-hidden">
              {conversation?.type !== "group" && (
                <button className="option-row danger-row" onClick={() => alert("Block API not added yet")}>
                  <span className="option-icon"><FaBan /></span>
                  <span className="fw-bold">Block {title}</span>
                </button>
              )}

              <button className="option-row danger-row" onClick={clearChat}>
                <span className="option-icon"><FaTrashAlt /></span>
                <span className="fw-bold">Clear chat</span>
              </button>
            </div>
          </div>
<div className="col-12 col-lg-8">
  <div className="soft-card shared-card p-3 p-sm-4 mb-4">
    <div className="d-flex align-items-center justify-content-between gap-3 mb-4">
      <div className="min-w-0">
        <div className="section-title">Shared content</div>
        <h5 className="fw-bold mb-0 text-truncate">Media, docs and links</h5>
      </div>

      <button
        className="btn shared-search-btn rounded-pill px-3 fw-bold border-0 flex-shrink-0"
        style={{ background: "#fff3eb", color: "#ff5b2f" }}
      >
        <FaSearch className="me-2 d-inline-block" />
        Search
      </button>
    </div>

    <div className="shared-tab-scroll mb-4">
      <div className="shared-tab-row">
        <button
          type="button"
          onClick={() => setActiveTab("media")}
          className={`tab-pill ${activeTab === "media" ? "active" : ""}`}
        >
          <FaRegImages className="me-2 d-inline-block" />
          Media <span>{media.length}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("docs")}
          className={`tab-pill ${activeTab === "docs" ? "active" : ""}`}
        >
          <FaFileAlt className="me-2 d-inline-block" />
          Docs <span>{docs.length}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("links")}
          className={`tab-pill ${activeTab === "links" ? "active" : ""}`}
        >
          <FaLink className="me-2 d-inline-block" />
          Links <span>{links.length}</span>
        </button>
      </div>
    </div>

    <div className="shared-content-area">
      {activeTab === "media" &&
        (media.length > 0 ? (
          <div className="media-grid">
            {media.map((item, index) => (
              <a
                key={`${item.url}-${index}`}
                href={item.url}
                target="_blank"
                className="media-tile"
              >
                {item.type === "video" ? (
                  <>
                    <video src={item.url} />
                    <span className="media-video-badge">
                      <FaVideo size={12} />
                    </span>
                  </>
                ) : (
                  <img src={item.url} alt={item.name || "media"} />
                )}
              </a>
            ))}
          </div>
        ) : (
          <EmptyInfo icon={<FaImage />} text="No media shared yet" />
        ))}

      {activeTab === "docs" &&
        (docs.length > 0 ? (
          <div className="shared-list">
            {docs.map((doc, index) => (
              <a
                key={`${doc.url}-${index}`}
                href={doc.url}
                target="_blank"
                className="shared-list-item text-decoration-none text-dark"
              >
                <span className="option-icon">
                  <FaFileAlt />
                </span>

                <span className="overflow-hidden flex-grow-1">
                  <span className="d-block fw-bold text-truncate">
                    {doc.name || "Document"}
                  </span>
                  <small className="text-secondary text-truncate d-block">
                    {doc.mimeType || "file"}
                  </small>
                </span>
              </a>
            ))}
          </div>
        ) : (
          <EmptyInfo icon={<FaFileAlt />} text="No documents shared yet" />
        ))}

      {activeTab === "links" &&
        (links.length > 0 ? (
          <div className="shared-list">
            {links.map((link, index) => (
              <a
                key={`${link.url}-${index}`}
                href={link.url}
                target="_blank"
                className="shared-list-item text-decoration-none text-dark"
              >
                <span className="option-icon">
                  <FaLink />
                </span>
                <span className="text-truncate flex-grow-1">{link.url}</span>
              </a>
            ))}
          </div>
        ) : (
          <EmptyInfo icon={<FaLink />} text="No links shared yet" />
        ))}
    </div>
  </div>

  {conversation?.type === "group" && (
    <div className="soft-card members-card p-3 p-sm-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <div className="section-title">Members</div>
          <h5 className="fw-bold mb-0">
            {conversation?.members?.length || 0} participants
          </h5>
        </div>
      </div>

      <div className="members-list">
        {(conversation?.members || []).map((member) => (
          <div key={member?._id} className="member-row">
            <img
              src={
                member?.avatar ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  member?.name || "User"
                )}&background=ff6b2c&color=ffffff&bold=true`
              }
              className="rounded-circle object-fit-cover flex-shrink-0"
              width="48"
              height="48"
              alt={member?.name}
            />

            <div className="min-w-0 flex-grow-1">
              <div className="fw-bold text-truncate">
                {member?.name || "User"}
              </div>
              <small className="text-secondary text-truncate d-block">
                {member?.email || "Member"}
              </small>
            </div>
          </div>
        ))}
      </div>
    </div>
  )}
</div>
        </div>
      </section>

      {showGroupModal && (
  <CreateGroupModal
    currentUser={currentUser}
    users={(conversation?.members || []).filter(
      (member) => member?._id !== currentUser?._id
    )}
    conversations={[]}
    onClose={() => setShowGroupModal(false)}
    onCreated={(newConversation) => {
      setShowGroupModal(false);
      if (newConversation?._id) {
        router.push(`/chat?conversationId=${newConversation._id}`);
      }
    }}
  />
)}

    </main>
  );
}

function EmptyInfo({ icon, text }) {
  return (
    <div className="empty-box">
      <div>
        <div
          className="mx-auto rounded-circle d-flex align-items-center justify-content-center mb-3"
          style={{
            width: 70,
            height: 70,
            background: "#fff3eb",
            color: "#ff5b2f",
            fontSize: 25,
          }}
        >
          {icon}
        </div>
        <div className="fw-bold text-secondary">{text}</div>
      </div>
    </div>
  );
}