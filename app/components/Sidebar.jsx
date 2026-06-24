"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import CreateGroupModal from "./CreateGroupModal";
import NetworkModal from "./NetworkModal";
import {
  FaUserEdit,
  FaSignOutAlt,
  FaUsers,
  FaPlus,
  FaSearch,
  FaComments,
  FaUserFriends,
  FaEye,
  FaTrashAlt,
  FaEllipsisV,
  FaChevronDown,
} from "react-icons/fa";
import { ChatAvatar } from "./Avatar";

export default function Sidebar({
  currentUser,
  selectedConversation,
  onSelectConversation,
  refreshKey,
  onRefresh,
  setMobileChatOpen,
}) {
  const router = useRouter();

  const [conversations, setConversations] = useState([]);
  const [users, setUsers] = useState([]);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);

  const [showGroup, setShowGroup] = useState(false);
  const [showNetwork, setShowNetwork] = useState(false);
  const [search, setSearch] = useState("");

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [openChatMenuId, setOpenChatMenuId] = useState(null);

  const [groupsOpen, setGroupsOpen] = useState(true);
  const [chatsOpen, setChatsOpen] = useState(true);

  const profileMenuRef = useRef(null);
  const chatMenuRef = useRef(null);

  const orangeGradient = "linear-gradient(135deg, #ff9d2e, #ff5b2f)";

  const privateChats = conversations.filter((c) => c?.type === "direct");
  const groupChats = conversations.filter((c) => c?.type === "group");

  function getAuthHeaders(extraHeaders = {}) {
    const token = localStorage.getItem("token");

    return {
      Authorization: token ? `Bearer ${token}` : "",
      ...extraHeaders,
    };
  }

  async function handleUnauthorized(res) {
    if (res.status === 401) {
      localStorage.clear();
      localStorage.setItem(
        "sessionMessage",
        "Your session has expired. Please login again."
      );
      router.push("/auth/login");
      return true;
    }

    return false;
  }

  useEffect(() => {
    if (!currentUser?._id) return;

    fetchConversations(conversations.length === 0);
    fetchUsers("", users.length === 0);

    const interval = setInterval(() => {
      fetchConversations(false);
    }, 5000);

    return () => clearInterval(interval);
  }, [currentUser?._id, refreshKey]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target)
      ) {
        setShowProfileMenu(false);
      }

      if (chatMenuRef.current && !chatMenuRef.current.contains(event.target)) {
        setOpenChatMenuId(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  async function fetchConversations(showLoader = false) {
    try {
      if (showLoader && conversations.length === 0) {
        setConversationsLoading(true);
      }

      const res = await fetch(`/api/conversations?userId=${currentUser?._id}`, {
        headers: getAuthHeaders(),
      });

      if (await handleUnauthorized(res)) return;

      const result = await res.json();
      setConversations(result?.conversations || []);
    } catch (error) {
      console.error("Fetch conversations error:", error);
      setConversations([]);
    } finally {
      if (showLoader) setConversationsLoading(false);
    }
  }

  async function fetchUsers(searchText = "", showLoader = false) {
    try {
      if (showLoader) setUsersLoading(true);

      const res = await fetch(
        `/api/users?userId=${currentUser?._id}&search=${searchText}`,
        {
          headers: getAuthHeaders(),
        }
      );

      if (await handleUnauthorized(res)) return;

      const result = await res.json();
      setUsers(result?.users || []);
    } catch (error) {
      console.error("Fetch users error:", error);
      setUsers([]);
    } finally {
      if (showLoader) setUsersLoading(false);
    }
  }

  async function startDirectChat(receiverId) {
    const token = localStorage.getItem("token");

    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          type: "direct",
          currentUserId: currentUser?._id,
          receiverId,
        }),
      });

      if (await handleUnauthorized(res)) return;

      const result = await res.json();

      if (!res.ok || !result?.success) {
        alert(result?.error || "Chat create failed");
        return;
      }

      setShowNetwork(false);

      setConversations((prev) => {
        const exists = prev.some(
          (item) => item?._id === result?.conversation?._id
        );

        if (exists) {
          return prev.map((item) =>
            item?._id === result?.conversation?._id
              ? result?.conversation
              : item
          );
        }

        return [result?.conversation, ...prev];
      });

      onSelectConversation(result?.conversation);
      setMobileChatOpen?.(true);
      router.push(`/chat?conversationId=${result?.conversation?._id}`);

      onRefresh?.();

      setTimeout(() => {
        fetchConversations(false);
      }, 300);
    } catch (error) {
      console.error("Start direct chat error:", error);
      alert("Something went wrong");
    }
  }

  async function startCallFromNetwork(receiverId, type) {
    const token = localStorage.getItem("token");

    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: JSON.stringify({
        type: "direct",
        currentUserId: currentUser?._id,
        receiverId,
      }),
    });

    if (await handleUnauthorized(res)) return;

    const result = await res.json();

    if (result?.success) {
      const conversationId = result?.conversation?._id;

      const callRes = await fetch("/api/calls", {
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

      if (await handleUnauthorized(callRes)) return;

      const callResult = await callRes.json();

      if (callResult?.success) {
        window.location.href = `/call?room=${conversationId}&type=${type}&callId=${callResult?.call?._id}`;
      }
    }
  }

  async function deleteConversation(conversationId) {
    const ok = confirm("Remove this chat?");
    if (!ok) return;

    const res = await fetch(
      `/api/conversations?conversationId=${conversationId}&userId=${currentUser?._id}`,
      {
        method: "DELETE",
        headers: getAuthHeaders(),
      }
    );

    if (await handleUnauthorized(res)) return;

    const result = await res.json();

    if (result?.success) {
      onRefresh?.();
      onSelectConversation(null);
      setMobileChatOpen?.(false);
      router.push("/chat");
      fetchConversations(false);
    }
  }

  async function handleConversationClick(conversation) {
    const res = await fetch("/api/messages/read", {
      method: "POST",
      headers: getAuthHeaders({
        "Content-Type": "application/json",
      }),
      body: JSON.stringify({
        conversationId: conversation?._id,
        userId: currentUser?._id,
      }),
    });

    if (await handleUnauthorized(res)) return;

    onSelectConversation(conversation);
    setMobileChatOpen?.(true);
    router.push(`/chat?conversationId=${conversation?._id}`);
    fetchConversations(false);
  }

  function handleEditProfile() {
    setShowProfileMenu(false);
    router.push("/profile");
  }

  function handleLogout() {
    localStorage.clear();
    document.cookie = "token=; path=/; max-age=0";
    router.push("/auth/login");
  }

  async function handleDeleteAccount() {
    const confirmDelete = window.confirm(
      "Are you sure? This will permanently delete your account, chats, messages and groups."
    );

    if (!confirmDelete) return;

    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");

      const res = await fetch(`/api/profile?userId=${user?._id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (await handleUnauthorized(res)) return;

      const result = await res.json();

      if (!result?.success) {
        alert(result?.error || "Delete failed");
        return;
      }

      localStorage.clear();
      document.cookie = "token=; path=/; max-age=0";

      alert("Account deleted successfully");
      router.replace("/auth/login");
    } catch (error) {
      console.error(error);
      alert("Delete failed");
    }
  }

  function getUserAvatar(user) {
    return (
      user?.avatar ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(
        user?.name || "User"
      )}&background=ff6b2c&color=ffffff&bold=true`
    );
  }

  function getConversationName(conversation) {
    if (conversation?.type === "group") return conversation?.name || "Group";

    const receiver = conversation?.members?.find(
      (member) => member?._id !== currentUser?._id
    );

    return receiver?.name || "Unknown User";
  }

  function renderConversationItem(conversation) {
    const active = selectedConversation?._id === conversation?._id;
    const isMenuOpen = openChatMenuId === conversation?._id;

    const lastSenderId =
      conversation?.lastMessage?.sender?._id || conversation?.lastMessage?.sender;

    const lastMessageText =
      lastSenderId === currentUser?._id
        ? `You: ${conversation?.lastMessage?.text || "File"}`
        : conversation?.lastMessage?.text || "No messages yet";

    return (
      <div
        key={conversation?._id}
        className={`sidebar-chat-item d-flex align-items-center px-3 py-2 position-relative ${
          active ? "active" : ""
        }`}
      >
        <button
          type="button"
          onClick={() => handleConversationClick(conversation)}
          className="btn p-0 flex-grow-1 d-flex align-items-center text-start border-0 overflow-hidden"
        >
          <ChatAvatar
            conversation={conversation}
            currentUser={currentUser}
            size={44}
          />

          <div className="ms-3 flex-grow-1 overflow-hidden">
            <div className="fw-bold text-dark text-truncate">
              {getConversationName(conversation)}
            </div>

            <div className="text-secondary text-truncate" style={{ fontSize: 13 }}>
              {lastMessageText}
            </div>
          </div>

          {conversation?.unreadCount > 0 && (
            <span
              className="text-white rounded-circle d-flex align-items-center justify-content-center fw-bold ms-2"
              style={{
                width: 24,
                height: 24,
                fontSize: 12,
                background: orangeGradient,
              }}
            >
              {conversation?.unreadCount > 99
                ? "99+"
                : conversation?.unreadCount}
            </span>
          )}
        </button>

        <div ref={isMenuOpen ? chatMenuRef : null} className="position-relative">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpenChatMenuId((prev) =>
                prev === conversation?._id ? null : conversation?._id
              );
            }}
            className="btn btn-sm ms-2 rounded-circle d-flex align-items-center justify-content-center border-0 text-secondary"
            style={{ width: 34, height: 34 }}
          >
            <FaEllipsisV size={12} />
          </button>

          {isMenuOpen && (
            <div
              className="position-absolute end-0 top-100 mt-2 bg-white border rounded-4 shadow-lg overflow-hidden"
              style={{ width: 190, zIndex: 9999 }}
            >
              <button
                type="button"
                onClick={() => {
                  setOpenChatMenuId(null);
                  deleteConversation(conversation?._id);
                }}
                className="btn w-100 text-start border-0 rounded-0 px-3 py-3 text-danger d-flex align-items-center gap-2"
              >
                <FaTrashAlt size={14} />
                <span className="small fw-semibold">Delete chat</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <aside className="sidebar-shell d-flex flex-column h-100 w-100 position-relative bg-white">
      <style>{`
        .sidebar-shell {
          color: #111827;
        }

        .sidebar-top-btn {
          width: 42px;
          height: 42px;
          border-radius: 999px;
          border: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #ff9d2e, #ff5b2f);
          color: white;
          box-shadow: 0 10px 22px rgba(255, 91, 47, 0.25);
          transition: .18s ease;
        }

        .sidebar-top-btn:hover {
          transform: translateY(-1px);
          filter: brightness(.98);
        }

        .sidebar-profile-menu {
          position: absolute;
          left: 0;
          top: calc(100% + 12px);
          width: 230px;
          background: #ffffff;
          border: 1px solid #f1f1f1;
          border-radius: 18px;
          overflow: hidden;
          z-index: 99999;
          box-shadow: 0 18px 50px rgba(15, 23, 42, 0.16);
        }

        .sidebar-profile-menu-item {
          width: 100%;
          border: 0;
          background: #ffffff;
          padding: 13px 16px;
          font-size: 14px;
          font-weight: 700;
          color: #334155;
          transition: 0.18s ease;
        }

        .sidebar-profile-menu-item:hover {
          background: #fff4ec;
          color: #ff5b2f;
        }

        .sidebar-search {
          background: #f8fafc;
          border-color: #eef2f7 !important;
        }

        .sidebar-search .input-group-text,
        .sidebar-search .form-control {
          background: transparent;
          border: 0;
          box-shadow: none;
        }

        .sidebar-accordion-card {
          border: 1px solid #f1f1f1;
          border-radius: 18px;
          overflow: hidden;
          background: #ffffff;
          margin: 0 12px 12px;
          box-shadow: 0 8px 20px rgba(15, 23, 42, 0.04);
        }

        .sidebar-accordion-head {
          width: 100%;
          border: 0;
          color: #ffffff;
          background: linear-gradient(135deg, #ff9d2e, #ff5b2f);
          padding: 12px 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-weight: 900;
        }

        .sidebar-accordion-title {
          display: flex;
          align-items: center;
          gap: 9px;
          min-width: 0;
        }

        .sidebar-accordion-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .accordion-action-btn {
          width: 30px;
          height: 30px;
          border-radius: 999px;
          border: 0;
          background: rgba(255,255,255,.22);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .accordion-chevron {
          transition: .2s ease;
        }

        .accordion-chevron.open {
          transform: rotate(180deg);
        }

        .sidebar-chat-item {
          transition: .18s ease;
          border-bottom: 1px solid #f8fafc;
        }

        .sidebar-chat-item:hover {
          background: #fff7f1;
        }

        .sidebar-chat-item.active {
          background: #fff1e7;
        }

        .empty-box {
          margin: 12px;
          padding: 18px;
          border-radius: 18px;
          background: #fff7f1;
          border: 1px dashed #ffbd9c;
          text-align: center;
        }

        .empty-action-btn {
          border: 0;
          border-radius: 999px;
          padding: 10px 16px;
          font-size: 13px;
          font-weight: 900;
          background: linear-gradient(135deg, #ff9d2e, #ff5b2f);
          color: #fff;
        }

        .sidebar-skeleton-row {
          padding: 10px 12px;
        }

        .sidebar-skeleton-avatar,
        .sidebar-skeleton-line,
        .sidebar-skeleton-dot {
          background: linear-gradient(90deg,#fff3eb 25%,#ffd9c7 50%,#fff3eb 75%);
          background-size: 200% 100%;
          animation: sidebarShimmer 1.15s infinite;
        }

        .sidebar-skeleton-avatar {
          width: 44px;
          height: 44px;
          border-radius: 999px;
          flex-shrink: 0;
        }

        .sidebar-skeleton-line {
          height: 11px;
          border-radius: 999px;
          margin-bottom: 9px;
        }

        .sidebar-skeleton-line-title {
          width: 70%;
        }

        .sidebar-skeleton-line-text {
          width: 45%;
        }

        .sidebar-skeleton-dot {
          width: 22px;
          height: 22px;
          border-radius: 999px;
        }

        @keyframes sidebarShimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      <header className="sidebar-header d-flex align-items-center justify-content-between px-3 py-3 border-bottom">
        <div
          ref={profileMenuRef}
          className="d-flex align-items-center gap-3 position-relative overflow-visible"
        >
          <button
            type="button"
            onClick={() => setShowProfileMenu((prev) => !prev)}
            className="btn p-0 border-0 rounded-circle flex-shrink-0"
            title="Profile"
          >
            <img
              src={getUserAvatar(currentUser)}
              className="rounded-circle object-fit-cover"
              width="44"
              height="44"
              alt="profile"
            />
          </button>

          {showProfileMenu && (
            <div className="sidebar-profile-menu">
              <button
                type="button"
                onClick={() => {
                  setShowProfileMenu(false);
                  setPreviewImage(currentUser?.avatar || getUserAvatar(currentUser));
                }}
                className="sidebar-profile-menu-item d-flex align-items-center gap-2"
              >
                <FaEye />
                View Profile
              </button>

              <button
                type="button"
                onClick={handleEditProfile}
                className="sidebar-profile-menu-item d-flex align-items-center gap-2"
              >
                <FaUserEdit />
                Edit Profile
              </button>

              <button
                type="button"
                onClick={handleDeleteAccount}
                className="sidebar-profile-menu-item text-danger d-flex align-items-center gap-2"
              >
                <FaTrashAlt />
                Delete Account
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="sidebar-profile-menu-item text-danger d-flex align-items-center gap-2"
              >
                <FaSignOutAlt />
                Logout
              </button>
            </div>
          )}

          <div className="overflow-hidden">
            <h6 className="mb-0 fw-bold text-dark text-truncate">
              {currentUser?.name || "User"}
            </h6>
            <small className="text-secondary">ChatterBox Pro Max</small>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            onClick={() => setShowNetwork(true)}
            className="sidebar-top-btn"
            title="Our Network"
            disabled={usersLoading}
          >
            <FaUserFriends />
          </button>

          <button
            type="button"
            onClick={() => setShowGroup(true)}
            className="sidebar-top-btn"
            title="Create Group"
          >
            <FaPlus />
          </button>
        </div>
      </header>

      <div className="px-3 py-3">
        <div className="input-group sidebar-search border rounded-4">
          <span className="input-group-text">
            <FaSearch />
          </span>
          <input
            value={search}
            onChange={(e) => {
              const value = e.target.value;
              setSearch(value);
              fetchUsers(value, false);
            }}
            placeholder="Search user by name"
            className="form-control"
          />
        </div>
      </div>

      <section className="sidebar-scroll flex-grow-1 overflow-auto pb-3">
        <AccordionSection
          title="Groups"
          icon={<FaUsers />}
          count={groupChats.length}
          open={groupsOpen}
          onToggle={() => setGroupsOpen((prev) => !prev)}
          actionIcon={<FaPlus />}
          onAction={() => setShowGroup(true)}
        >
          {conversationsLoading ? (
            <SidebarSkeleton count={3} />
          ) : groupChats.length > 0 ? (
            groupChats.map((conversation) => renderConversationItem(conversation))
          ) : (
            <div className="empty-box">
              <div className="fw-bold text-dark mb-1">No groups yet</div>
              <div className="small text-secondary mb-3">
                Create your first group chat.
              </div>
              <button
                type="button"
                onClick={() => setShowGroup(true)}
                className="empty-action-btn "
              >
                <FaPlus className="me-2" />
                Create Group
              </button>
            </div>
          )}
        </AccordionSection>

        <AccordionSection
          title="Chats"
          icon={<FaComments />}
          count={privateChats.length}
          open={chatsOpen}
          onToggle={() => setChatsOpen((prev) => !prev)}
          actionIcon={<FaPlus />}
          onAction={() => setShowNetwork(true)}
        >
          {conversationsLoading ? (
            <SidebarSkeleton count={5} />
          ) : privateChats.length > 0 ? (
            privateChats.map((conversation) => renderConversationItem(conversation))
          ) : (
            <div className="empty-box">
              <div className="fw-bold text-dark mb-1">No chats yet</div>
              <div className="small text-secondary mb-3">
                Start a new private chat.
              </div>
              <button
                type="button"
                onClick={() => setShowNetwork(true)}
                className="empty-action-btn"
              >
                <FaPlus className="me-2" />
                New Chat
              </button>
            </div>
          )}
        </AccordionSection>
      </section>

      {showGroup && (
        <CreateGroupModal
          currentUser={currentUser}
          users={users}
          onClose={() => setShowGroup(false)}
          onCreated={(conversation) => {
            setShowGroup(false);

            if (conversation?._id) {
              setConversations((prev) => [conversation, ...prev]);
              onSelectConversation(conversation);
              setMobileChatOpen?.(true);
              router.push(`/chat?conversationId=${conversation?._id}`);
            }

            onRefresh?.();
            fetchConversations(false);
          }}
        />
      )}

      {previewImage && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 bg-black bg-opacity-100 d-flex align-items-center justify-content-center"
          style={{ zIndex: 99999 }}
          onClick={() => setPreviewImage(null)}
        >
          <button
            className="btn btn-danger position-absolute top-0 end-0 m-3"
            onClick={() => setPreviewImage(null)}
          >
            ✕
          </button>

          <img
            src={previewImage}
            alt="preview"
            style={{
              maxWidth: "95%",
              maxHeight: "95%",
              objectFit: "contain",
            }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {showNetwork && (
        <NetworkModal
          currentUser={currentUser}
          onClose={() => setShowNetwork(false)}
          onStartChat={(receiverId) => {
            setShowNetwork(false);
            startDirectChat(receiverId);
          }}
          onStartCall={(receiverId, type) => {
            setShowNetwork(false);
            startCallFromNetwork(receiverId, type);
          }}
        />
      )}
    </aside>
  );
}

function AccordionSection({
  title,
  icon,
  count,
  open,
  onToggle,
  actionIcon,
  onAction,
  children,
}) {
  return (
    <div className="sidebar-accordion-card">
      <button
        type="button"
        onClick={onToggle}
        className="sidebar-accordion-head"
      >
        <span className="sidebar-accordion-title">
          {icon}
          <span>{title}</span>
          <span className="badge bg-white text-dark rounded-pill">{count}</span>
        </span>

        <span className="sidebar-accordion-actions">
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              onAction?.();
            }}
            className="accordion-action-btn"
          >
            {actionIcon}
          </span>

          <FaChevronDown className={`accordion-chevron ${open ? "open" : ""}`} />
        </span>
      </button>

      {open && <div className="accordion-body p-0">{children}</div>}
    </div>
  );
}

function SidebarSkeleton({ count = 4 }) {
  return (
    <div className="py-2">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="d-flex align-items-center gap-3 sidebar-skeleton-row"
        >
          <div className="sidebar-skeleton-avatar" />

          <div className="flex-grow-1">
            <div className="sidebar-skeleton-line sidebar-skeleton-line-title" />
            <div className="sidebar-skeleton-line sidebar-skeleton-line-text" />
          </div>

          <div className="sidebar-skeleton-dot" />
        </div>
      ))}
    </div>
  );
}