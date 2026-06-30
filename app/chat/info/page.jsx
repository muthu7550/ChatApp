"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FaArrowLeft,
  FaBan,
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
  FaGlobe,
  FaUserPlus,
  FaDoorOpen,
  FaEdit,
  FaCheckCircle,
} from "react-icons/fa";
import CreateGroupModal from "../../components/CreateGroupModal";

const ORANGE = "linear-gradient(135deg, #ff9d2e, #ff5b2f)";

export default function ChatInfoPage() {
  return (
    <Suspense fallback={<InfoLoading />}>
      <ChatInfoContent />
    </Suspense>
  );
}

function ChatInfoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const conversationId = searchParams.get("conversationId");

  const [currentUser, setCurrentUser] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [activeTab, setActiveTab] = useState("media");
  const [loading, setLoading] = useState(true);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showAddPeople, setShowAddPeople] = useState(false);
  const [showShareInvite, setShowShareInvite] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [inviteActionLoading, setInviteActionLoading] = useState(false);

  useEffect(() => {
    setCurrentUser(JSON.parse(localStorage.getItem("user") || "null"));
  }, []);

  useEffect(() => {
    if (!conversationId || !currentUser?._id) return;
    loadInfo();
  }, [conversationId, currentUser?._id]);

  const isGroup = conversation?.type === "group";

  const isAdmin =
    conversation?.admins?.some?.(
      (admin) =>
        (admin?._id || admin)?.toString() === currentUser?._id?.toString(),
    ) || false;

  const canAddMembers =
    isGroup && (isAdmin || conversation?.memberPermission === "all");

  const otherPerson = useMemo(() => {
    if (!conversation || isGroup) return null;
    return conversation?.members?.find(
      (member) => member?._id !== currentUser?._id,
    );
  }, [conversation, currentUser?._id, isGroup]);

  const title = isGroup
    ? conversation?.name || "Group"
    : otherPerson?.name || "User";

  const avatar =
    conversation?.avatar ||
    conversation?.image ||
    otherPerson?.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      title || "User",
    )}&background=ff6b2c&color=ffffff&bold=true`;

  const sortedMembers = useMemo(() => {
    const list = conversation?.members || [];
    return [...list].sort((a, b) => {
      if (a?._id === currentUser?._id) return -1;
      if (b?._id === currentUser?._id) return 1;
      return (a?.name || "").localeCompare(b?.name || "");
    });
  }, [conversation?.members, currentUser?._id]);

  const pendingJoinRequests = useMemo(() => {
    return (conversation?.joinRequests || []).filter(
      (req) => req?.status === "pending",
    );
  }, [conversation?.joinRequests]);

  const media = [];
  const docs = [];
  const links = [];

  messages.forEach((message) => {
    message?.attachments?.forEach((file) => {
      if (file?.type === "image" || file?.type === "video") media.push(file);
      else docs.push(file);
    });

    const foundLinks = message?.text?.match?.(/(https?:\/\/[^\s]+)/g) || [];
    foundLinks.forEach((link) =>
      links.push({ url: link, text: message?.text }),
    );
  });

  const isBlockedByMe =
    !isGroup &&
    currentUser?.blockedUsers?.some?.(
      (id) => id?.toString() === otherPerson?._id?.toString(),
    );

  const isBlockedByOther =
    !isGroup &&
    otherPerson?.blockedUsers?.some?.(
      (id) => id?.toString() === currentUser?._id?.toString(),
    );

  const isChatRestricted = !isGroup && (isBlockedByMe || isBlockedByOther);

  async function loadUsersForAdd() {
    const token = localStorage.getItem("token");

    const res = await fetch(`/api/users?userId=${currentUser?._id}&search=`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
    });

    const result = await res.json();
    setAllUsers(result?.users || []);
    setShowAddPeople(true);
  }

  async function loadInfo() {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const convRes = await fetch(
        `/api/conversations?userId=${currentUser._id}`,
        { headers: { Authorization: token ? `Bearer ${token}` : "" } },
      );

      const convResult = await convRes.json();
      const found = convResult?.conversations?.find(
        (item) => item?._id === conversationId,
      );

      setConversation(found || null);

      const msgRes = await fetch(
        `/api/messages?conversationId=${conversationId}&userId=${currentUser._id}`,
        { headers: { Authorization: token ? `Bearer ${token}` : "" } },
      );

      const msgResult = await msgRes.json();
      setMessages(msgResult?.messages || []);
    } catch (error) {
      console.error("Load chat info error:", error);
    } finally {
      setLoading(false);
    }
  }

  function getInviteLink() {
    return conversation?.inviteLink || "";
  }

  async function loadUsers() {
    const token = localStorage.getItem("token");

    const res = await fetch(`/api/users?userId=${currentUser?._id}&search=`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
    });

    const result = await res.json();
    setAllUsers(result?.users || []);
  }

  async function openAddPeople() {
    await loadUsers();
    setShowAddPeople(true);
  }

  async function openShareInvite() {
    if (!conversation?.inviteLink) {
      const result = await updateGroup("generate_invite_link");
      if (!result?.conversation?.inviteLink) return;
    }

    await loadUsers();
    setShowShareInvite(true);
  }

  async function addPeopleToGroup(selectedIds) {
    await updateGroup("add_members", {
      targetUserIds: selectedIds,
    });

    setShowAddPeople(false);
    await loadInfo();
  }

  async function shareInviteToPrivateChats(selectedIds) {
    for (const receiverId of selectedIds) {
      const convRes = await fetch("/api/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "direct",
          currentUserId: currentUser?._id,
          receiverId,
        }),
      });

      const convResult = await convRes.json();

      if (convResult?.conversation?._id) {
        const privateChatId = convResult.conversation._id;
        const inviteLink = `${getInviteLink()}&from=${privateChatId}`;

        await fetch("/api/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            conversationId: privateChatId,
            senderId: currentUser?._id,
            text: `Join my group "${conversation?.name}" 👇\n${inviteLink}`,
            attachments: [],
            location: null,
          }),
        });
      }
    }

    setShowShareInvite(false);
    alert("Invite sent to private chat");
  }
  async function generateInviteLink() {
    const result = await updateGroup("generate_invite_link");

    if (result?.conversation?.inviteLink) {
      await navigator.clipboard.writeText(result.conversation.inviteLink);
      alert("Invite link generated and copied");
    }
  }

  async function copyInviteLink() {
    if (!getInviteLink()) {
      alert("Generate invite link first");
      return;
    }

    await navigator.clipboard.writeText(getInviteLink());
    alert("Invite link copied");
  }

  async function shareInviteToUsers(selectedIds = []) {
    if (selectedIds.length === 0) return;

    try {
      setInviteActionLoading(true);

      const inviteLink = getInviteLink();

      await updateGroup("add_members", {
        targetUserIds: selectedIds,
      });

      await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationId,
          senderId: currentUser?._id,
          text: `Group invite link: ${inviteLink}`,
          attachments: [],
          location: null,
        }),
      });

      setShowShareInvite(false);
      await loadInfo();
      alert("Members added and invite message sent");
    } finally {
      setInviteActionLoading(false);
    }
  }

  async function updateGroup(action, extra = {}) {
    const token = localStorage.getItem("token");

    const res = await fetch("/api/groups", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: JSON.stringify({
        conversationId,
        userId: currentUser?._id,
        action,
        ...extra,
      }),
    });

    const result = await res.json();

    if (!res.ok || !result?.success) {
      alert(result?.error || "Group update failed");
      return null;
    }

    if (action === "leave_group") {
      router.replace("/chat");
      return result;
    }

    setConversation(result.conversation);
    return result;
  }
async function clearChat() {
  const ok = confirm(
    isGroup
      ? "Clear group messages and calls for you?"
      : "Clear messages and calls for you?",
  );

  if (!ok) return;

  const token = localStorage.getItem("token");

  const res = await fetch("/api/conversations/clear-chat", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    },
    body: JSON.stringify({
      conversationId,
      userId: currentUser?._id,
    }),
  });

  const result = await res.json().catch(() => null);

  if (!res.ok || !result?.success) {
    alert(result?.error || "Clear chat failed");
    return;
  }

setMessages([]);
router.replace(`/chat?conversationId=${conversationId}&cleared=${Date.now()}`);
}

  async function blockUser() {
    if (!currentUser?._id || !otherPerson?._id) return;

    const ok = confirm(`Block ${title}?`);
    if (!ok) return;

    const token = localStorage.getItem("token");

    const res = await fetch("/api/users/block", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: JSON.stringify({
        userId: currentUser._id,
        targetUserId: otherPerson._id,
      }),
    });

    const result = await res.json();

    if (result?.success) {
      const updatedUser = {
        ...currentUser,
        blockedUsers: [...(currentUser?.blockedUsers || []), otherPerson._id],
      };

      localStorage.setItem("user", JSON.stringify(updatedUser));
      window.location.href = `/chat?conversationId=${conversationId}`;
    } else {
      alert(result?.error || "Block failed");
    }
  }

  async function unblockUser() {
    if (!currentUser?._id || !otherPerson?._id) return;

    const ok = confirm(`Unblock ${title}?`);
    if (!ok) return;

    const token = localStorage.getItem("token");

    const res = await fetch(
      `/api/users/block?userId=${currentUser._id}&targetUserId=${otherPerson._id}`,
      {
        method: "DELETE",
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      },
    );

    const result = await res.json();

    if (!res.ok || !result?.success) {
      alert(result?.error || "Unblock failed");
      return;
    }

    const updatedUser = {
      ...currentUser,
      blockedUsers: (currentUser?.blockedUsers || []).filter(
        (id) => id?.toString() !== otherPerson?._id?.toString(),
      ),
    };

    localStorage.setItem("user", JSON.stringify(updatedUser));
    window.location.href = `/chat?conversationId=${conversationId}`;
  }

  async function startCall(type) {
    if (isChatRestricted) {
      alert("Call not allowed for blocked contact");
      return;
    }

    const token = localStorage.getItem("token");

    const res = await fetch("/api/calls", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: JSON.stringify({
        conversationId,
        callerId: currentUser?._id,
        type,
      }),
    });

    const result = await res.json();

    if (!res.ok || !result?.success) {
      alert(result?.error || "Call create failed");
      return;
    }

    router.push(
      `/call?room=${conversationId}&type=${type}&callId=${result?.call?._id}`,
    );
  }

  if (loading) return <InfoLoading />;

  return (
    <main className="info-page">
      <style>{`
        .info-page {
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
          background: rgba(255,255,255,.92);
          border-bottom: 1px solid rgba(226,232,240,.9);
        }

        .page-container {
          max-width: 1180px;
        }

        .soft-card {
          background: #ffffff;
          border: 1px solid #eef2f7;
          border-radius: 26px;
          box-shadow: 0 16px 38px rgba(15,23,42,.06);
          overflow: hidden;
        }

        .hero-card {
          border-radius: 30px;
          overflow: hidden;
          background: #ffffff;
          box-shadow: 0 24px 70px rgba(15,23,42,.10);
          border: 1px solid rgba(255,217,199,.9);
        }

        .hero-cover {
          height: 145px;
          background:
            radial-gradient(circle at 16% 10%, rgba(255,255,255,.58), transparent 18%),
            radial-gradient(circle at 80% 25%, rgba(255,255,255,.32), transparent 24%),
            ${ORANGE};
        }

        .avatar-wrap {
          width: 128px;
          height: 128px;
          margin-top: -64px;
          padding: 5px;
          border-radius: 999px;
          background: #ffffff;
          box-shadow: 0 20px 48px rgba(255,91,47,.26);
        }

        .info-avatar {
          width: 100%;
          height: 100%;
          border-radius: 999px;
          object-fit: cover;
        }

        .quick-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }

        .quick-btn {
          border: 0;
          border-radius: 20px;
          background: #fff7f1;
          color: #ff5b2f;
          padding: 14px 8px;
          font-weight: 900;
          transition: .18s ease;
          width: 100%;
        }

        .quick-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 16px 34px rgba(255,91,47,.16);
        }

        .quick-btn:disabled {
          opacity: .45;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .section-title {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: .08em;
          color: #94a3b8;
          font-weight: 900;
        }

        .option-row {
          width: 100%;
          border: 0;
          background: #ffffff;
          padding: 16px;
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

        .group-settings-grid {
          display: grid;
          grid-template-columns: 1fr;
        }

        .tab-pill {
          border: 0;
          border-radius: 999px;
          padding: 11px 16px;
          font-weight: 900;
          background: #f1f5f9;
          color: #64748b;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .tab-pill.active {
          color: white;
          background: ${ORANGE};
          box-shadow: 0 12px 26px rgba(255,91,47,.22);
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

        .shared-content-area {
          height: 360px;
          overflow-y: auto;
          overflow-x: hidden;
          padding-right: 4px;
        }

        .shared-content-area::-webkit-scrollbar,
        .members-list::-webkit-scrollbar {
          width: 6px;
        }

        .shared-content-area::-webkit-scrollbar-thumb,
        .members-list::-webkit-scrollbar-thumb {
          background: #ffd0ba;
          border-radius: 999px;
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

        .members-list {
          max-height: 520px;
          overflow-y: auto;
          padding-right: 4px;
        }

        .member-row {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding: 14px;
          border-radius: 20px;
          transition: 0.18s ease;
          border: 1px solid transparent;
        }

        .member-row:hover {
          background: #fff7f1;
          border-color: #ffd9c7;
        }

        .member-row.me {
          background: linear-gradient(135deg, #fff7f1, #ffffff);
          border: 1px solid #ffd9c7;
        }

        .member-action-btn {
          font-size: 12px;
          font-weight: 800;
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

          .shared-content-area {
            height: 330px;
          }
        }

        @media (max-width: 576px) {
          .page-container {
            padding-left: 10px;
            padding-right: 10px;
          }

          .hero-card {
            border-radius: 0 0 28px 28px;
          }

          .hero-cover {
            height: 118px;
          }

          .avatar-wrap {
            width: 106px;
            height: 106px;
            margin-top: -53px;
          }

          .quick-btn {
            font-size: 12px;
            padding: 12px 6px;
          }

          .media-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .shared-content-area {
            height: 300px;
          }

          .member-row {
            padding: 12px 8px;
          }
        }
      `}</style>

      <header className="top-bar px-3 py-3">
        <div className="container page-container d-flex align-items-center gap-3">
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
              {isGroup ? "Group info" : "Contact info"}
            </h6>
            <small className="text-secondary text-truncate d-block">
              {title}
            </small>
          </div>
        </div>
      </header>

      <section className="container page-container py-3 py-sm-4 pb-5">
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
                  {isGroup
                    ? `${conversation?.members?.length || 0} members`
                    : otherPerson?.email || "Private chat"}
                </p>

                <div className="quick-grid">
                  <button
                    type="button"
                    className="quick-btn"
                    onClick={() => startCall("audio")}
                  >
                    <FaPhoneAlt className="d-block mx-auto mb-2" />
                    Audio
                  </button>

                  <button
                    type="button"
                    className="quick-btn"
                    onClick={() => startCall("video")}
                  >
                    <FaVideo className="d-block mx-auto mb-2" />
                    Video
                  </button>

                  <button
                    type="button"
                    className="quick-btn"
                    onClick={() =>
                      router.push(`/chat?conversationId=${conversationId}`)
                    }
                  >
                    <FaComments className="d-block mx-auto mb-2" />
                    Chat
                  </button>
                </div>
              </div>
            </div>

            <div className="soft-card p-4 mb-4">
              <div className="section-title mb-2">About</div>
              <div className="fw-semibold">
                {isGroup
                  ? conversation?.description || "Group created in ChatterBox."
                  : "Hey there! I am using ChatterBox."}
              </div>
            </div>

            {isGroup && (
              <div className="soft-card mb-4">
                {isAdmin && (
                  <>
                    <button
                      className="option-row"
                      onClick={() =>
                        updateGroup("update_settings", {
                          groupPrivacy:
                            conversation?.groupPrivacy === "public"
                              ? "private"
                              : "public",
                        })
                      }
                    >
                      <span className="option-icon">
                        <FaGlobe />
                      </span>
                      <span className="fw-bold">
                        Make group{" "}
                        {conversation?.groupPrivacy === "public"
                          ? "private"
                          : "public"}
                      </span>
                    </button>

                    <button
                      className="option-row"
                      onClick={() =>
                        updateGroup("update_settings", {
                          messagePermission:
                            conversation?.messagePermission === "admins"
                              ? "all"
                              : "admins",
                        })
                      }
                    >
                      <span className="option-icon">
                        <FaComments />
                      </span>
                      <span className="fw-bold">
                        {conversation?.messagePermission === "admins"
                          ? "Allow everyone to message"
                          : "Only admins can message"}
                      </span>
                    </button>

                    <button
                      className="option-row"
                      onClick={() =>
                        updateGroup("update_settings", {
                          memberPermission:
                            conversation?.memberPermission === "admins"
                              ? "all"
                              : "admins",
                        })
                      }
                    >
                      <span className="option-icon">
                        <FaUserPlus />
                      </span>
                      <span className="fw-bold">
                        {conversation?.memberPermission === "admins"
                          ? "Allow members to add people"
                          : "Only admins can add people"}
                      </span>
                    </button>

                    <button
                      className="option-row"
                      onClick={() =>
                        updateGroup("update_settings", {
                          joinApproval: !conversation?.joinApproval,
                        })
                      }
                    >
                      <span className="option-icon">
                        <FaCheckCircle />
                      </span>
                      <span className="fw-bold">
                        {conversation?.joinApproval
                          ? "Disable join approval"
                          : "Enable join approval"}
                      </span>
                    </button>

                    <div className="option-row d-block">
                      <div className="d-flex align-items-start gap-3">
                        <span className="option-icon">
                          <FaLink />
                        </span>

                        <div className="flex-grow-1 overflow-hidden">
                          <div className="d-flex align-items-center justify-content-between gap-2">
                            <span className="fw-bold">Invite link</span>

                            <button
                              type="button"
                              onClick={generateInviteLink}
                              className="btn btn-sm rounded-pill text-white fw-bold border-0 px-3"
                              style={{
                                background: ORANGE,
                                fontSize: 12,
                              }}
                            >
                              {conversation?.inviteLink
                                ? "Get New"
                                : "Generate"}
                            </button>
                          </div>

                          <small className="text-secondary text-truncate d-block mt-1">
                            {conversation?.inviteLink ||
                              "Generate a link to invite people"}
                          </small>
                        </div>
                      </div>

                      {conversation?.inviteLink && (
                        <div className="d-flex gap-2 mt-3 ps-sm-5">
                          <button
                            type="button"
                            onClick={copyInviteLink}
                            className="btn btn-light rounded-pill flex-fill fw-bold border"
                          >
                            Copy
                          </button>

                          <button
                            type="button"
                            onClick={openShareInvite}
                            className="btn rounded-pill flex-fill text-white fw-bold border-0"
                            style={{ background: ORANGE }}
                          >
                            Share
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}

                <button
                  className="option-row danger-row"
                  onClick={() => {
                    const ok = confirm("Leave this group?");
                    if (ok) updateGroup("leave_group");
                  }}
                >
                  <span className="option-icon">
                    <FaDoorOpen />
                  </span>
                  <span className="fw-bold">Leave group</span>
                </button>
              </div>
            )}

            <div className="soft-card mb-4">
              {!isGroup && (
                <button
                  type="button"
                  className="option-row"
                  onClick={() => setShowGroupModal(true)}
                >
                  <span className="option-icon">
                    <FaUsers />
                  </span>
                  <span>
                    <span className="d-block fw-bold">
                      Create group with {title}
                    </span>
                    <small className="text-secondary">
                      Add more people to this chat
                    </small>
                  </span>
                </button>
              )}

              <button className="option-row">
                <span className="option-icon">
                  <FaUserShield />
                </span>
                <span>
                  <span className="d-block fw-bold">Encryption</span>
                  <small className="text-secondary">
                    Messages stay private
                  </small>
                </span>
              </button>
            </div>

            <div className="soft-card">
              {!isGroup &&
                (isBlockedByMe ? (
                  <button
                    className="option-row danger-row"
                    onClick={unblockUser}
                  >
                    <span className="option-icon">
                      <FaBan />
                    </span>
                    <span className="fw-bold">Unblock {title}</span>
                  </button>
                ) : (
                  <button className="option-row danger-row" onClick={blockUser}>
                    <span className="option-icon">
                      <FaBan />
                    </span>
                    <span className="fw-bold">Block {title}</span>
                  </button>
                ))}

              <button className="option-row danger-row" onClick={clearChat}>
                <span className="option-icon">
                  <FaTrashAlt />
                </span>
                <span className="fw-bold">
                  {isGroup ? "Clear group messages" : "Clear chat"}
                </span>
              </button>
            </div>
          </div>

          <div className="col-12 col-lg-8">
            <div className="soft-card p-3 p-sm-4 mb-4">
              <div className="d-flex align-items-center justify-content-between gap-3 mb-4">
                <div className="min-w-0">
                  <div className="section-title">Shared content</div>
                  <h5 className="fw-bold mb-0 text-truncate">
                    Media, docs and links
                  </h5>
                </div>

                <button
                  className="btn rounded-pill px-3 fw-bold border-0 flex-shrink-0"
                  style={{ background: "#fff3eb", color: "#ff5b2f" }}
                >
                  <FaSearch className="me-2 d-inline-block" />
                  Search
                </button>
              </div>

              <div className="shared-tab-scroll mb-4">
                <div className="shared-tab-row">
                  <TabButton
                    active={activeTab === "media"}
                    onClick={() => setActiveTab("media")}
                    icon={<FaRegImages />}
                    label="Media"
                    count={media.length}
                  />

                  <TabButton
                    active={activeTab === "docs"}
                    onClick={() => setActiveTab("docs")}
                    icon={<FaFileAlt />}
                    label="Docs"
                    count={docs.length}
                  />

                  <TabButton
                    active={activeTab === "links"}
                    onClick={() => setActiveTab("links")}
                    icon={<FaLink />}
                    label="Links"
                    count={links.length}
                  />
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
                    <EmptyInfo
                      icon={<FaFileAlt />}
                      text="No documents shared yet"
                    />
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
                          <span className="text-truncate flex-grow-1">
                            {link.url}
                          </span>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <EmptyInfo icon={<FaLink />} text="No links shared yet" />
                  ))}
              </div>
            </div>

            {isGroup && (
              <div className="soft-card p-3 p-sm-4">
                <div className="d-flex align-items-center justify-content-between gap-3 mb-3">
                  <div>
                    <div className="section-title">Members</div>
                    <h5 className="fw-bold mb-0">
                      {conversation?.members?.length || 0} participants
                    </h5>
                  </div>

                  {canAddMembers && (
                    <button
                      type="button"
                      onClick={openAddPeople}
                      className="btn rounded-pill px-3 fw-bold border-0"
                      style={{ background: "#fff3eb", color: "#ff5b2f" }}
                    >
                      <FaUserPlus className="me-2 d-inline-block" />
                      Add
                    </button>
                  )}
                </div>
                {isAdmin && pendingJoinRequests.length > 0 && (
                  <div
                    className="mb-4 rounded-4 p-3"
                    style={{ background: "#fff7f1" }}
                  >
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <div>
                        <div className="section-title">Pending Requests</div>
                        <h6 className="fw-bold mb-0">
                          {pendingJoinRequests.length} join request
                          {pendingJoinRequests.length > 1 ? "s" : ""}
                        </h6>
                      </div>
                    </div>

                    {pendingJoinRequests.map((request) => {
                      const user = request?.user;

                      return (
                        <div
                          key={user?._id || request?._id}
                          className="d-flex align-items-center gap-3 bg-white rounded-4 p-3 mb-2 border"
                        >
                          <img
                            src={user?.avatar || "/default-avatar.png"}
                            className="rounded-circle object-fit-cover"
                            width="46"
                            height="46"
                            alt={user?.name || "user"}
                          />

                          <div className="flex-grow-1 min-w-0">
                            <div className="fw-bold text-truncate">
                              {user?.name || "User"}
                            </div>
                            <small className="text-secondary d-block text-truncate">
                              {user?.email || "Requested to join"}
                            </small>
                          </div>

                          <div className="d-flex gap-2 flex-wrap">
                            <button
                              type="button"
                              className="btn btn-sm btn-success rounded-pill fw-bold"
                              onClick={() =>
                                updateGroup("approve_join_request", {
                                  targetUserId: user?._id,
                                }).then(() => loadInfo())
                              }
                            >
                              Approve
                            </button>

                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger rounded-pill fw-bold"
                              onClick={() =>
                                updateGroup("reject_join_request", {
                                  targetUserId: user?._id,
                                }).then(() => loadInfo())
                              }
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="members-list">
                  {sortedMembers.map((member) => {
                    const memberId = member?._id?.toString();
                    const isMe = memberId === currentUser?._id?.toString();

                    const isMemberAdmin =
                      conversation?.admins?.some(
                        (admin) =>
                          (admin?._id || admin)?.toString() === memberId,
                      ) || false;

                    return (
                      <div
                        key={member?._id}
                        className={`member-row ${isMe ? "me" : ""}`}
                      >
                        <img
                          src={
                            member?.avatar ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              member?.name || "User",
                            )}&background=ff6b2c&color=ffffff&bold=true`
                          }
                          className="rounded-circle object-fit-cover flex-shrink-0"
                          width="50"
                          height="50"
                          alt={member?.name}
                        />

                        <div className="flex-grow-1 min-w-0">
                          <div className="d-flex align-items-center gap-2 flex-wrap">
                            <div className="fw-bold text-truncate">
                              {member?.name || "User"} {isMe ? "(You)" : ""}
                            </div>

                            {isMemberAdmin && (
                              <span className="badge bg-warning text-dark rounded-pill">
                                Admin
                              </span>
                            )}
                          </div>

                          <small className="text-secondary d-block text-truncate">
                            {member?.email || "Member"}
                          </small>

                          {isAdmin && !isMe && (
                            <div className="d-flex gap-2 flex-wrap mt-2">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger rounded-pill member-action-btn"
                                onClick={() =>
                                  updateGroup("remove_member", {
                                    targetUserId: member._id,
                                  })
                                }
                              >
                                Remove
                              </button>

                              {isMemberAdmin ? (
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-secondary rounded-pill member-action-btn"
                                  onClick={() =>
                                    updateGroup("demote_admin", {
                                      targetUserId: member._id,
                                    })
                                  }
                                >
                                  Remove Admin
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-success rounded-pill member-action-btn"
                                  onClick={() =>
                                    updateGroup("promote_admin", {
                                      targetUserId: member._id,
                                    })
                                  }
                                >
                                  Make Admin
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
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
            (member) => member?._id !== currentUser?._id,
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

      {showAddPeople && (
        <AddPeopleModal
          title="Add people"
          submitLabel="Add"
          users={allUsers.filter(
            (user) =>
              !conversation?.members?.some(
                (member) => member?._id?.toString() === user?._id?.toString(),
              ),
          )}
          onClose={() => setShowAddPeople(false)}
          onAdd={addPeopleToGroup}
        />
      )}

      {showShareInvite && (
        <AddPeopleModal
          title="Share invite"
          submitLabel="Send Invite"
          users={allUsers.filter((user) => user?._id !== currentUser?._id)}
          onClose={() => setShowShareInvite(false)}
          onAdd={shareInviteToPrivateChats}
        />
      )}
    </main>
  );
}

function TabButton({ active, onClick, icon, label, count }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`tab-pill ${active ? "active" : ""}`}
    >
      <span className="me-2 d-inline-flex">{icon}</span>
      {label} <span>{count}</span>
    </button>
  );
}

function InfoLoading() {
  return (
    <main className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="spinner-border" style={{ color: "#ff5b2f" }} />
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

function AddPeopleModal({
  users = [],
  onClose,
  onAdd,
  title = "Add people",
  submitLabel = "Add",
}) {
  const [selected, setSelected] = useState([]);

  function toggleUser(id) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  }

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 bg-black bg-opacity-75 d-flex align-items-center justify-content-center p-3"
      style={{ zIndex: 99999 }}
    >
      <div
        className="bg-white rounded-4 shadow-lg w-100"
        style={{ maxWidth: 460 }}
      >
        <div className="p-4 border-bottom d-flex justify-content-between">
          <h5 className="fw-bold mb-0">{title}</h5>
          <button
            className="btn btn-sm btn-light rounded-circle"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="p-3" style={{ maxHeight: 380, overflowY: "auto" }}>
          {users.map((user) => (
            <button
              key={user?._id}
              type="button"
              onClick={() => toggleUser(user?._id)}
              className="btn w-100 text-start d-flex align-items-center gap-3 rounded-4 p-3 mb-2"
              style={{
                background: selected.includes(user?._id)
                  ? "#fff3eb"
                  : "#f8fafc",
              }}
            >
              <img
                src={user?.avatar || "/default-avatar.png"}
                className="rounded-circle object-fit-cover"
                width="44"
                height="44"
                alt=""
              />

              <div className="flex-grow-1">
                <div className="fw-bold">{user?.name}</div>
                <small className="text-secondary">{user?.email}</small>
              </div>

              <input
                type="checkbox"
                checked={selected.includes(user?._id)}
                readOnly
              />
            </button>
          ))}

          {users.length === 0 && (
            <p className="text-center text-secondary py-4 mb-0">
              No users available to add
            </p>
          )}
        </div>

        <div className="p-3 border-top d-flex gap-2">
          <button
            className="btn btn-light flex-fill rounded-4"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            className="btn flex-fill rounded-4 text-white fw-bold"
            disabled={selected.length === 0}
            style={{ background: "linear-gradient(135deg, #ff9d2e, #ff5b2f)" }}
            onClick={() => onAdd(selected)}
          >
            {submitLabel} {selected.length || ""}
          </button>
        </div>
      </div>
    </div>
  );
}
