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
} from "react-icons/fa";

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
  const [search, setSearch] = useState("");
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNetwork, setShowNetwork] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [openChatMenuId, setOpenChatMenuId] = useState(null);

  const profileMenuRef = useRef(null);
  const chatMenuRef = useRef(null);

  const privateChats = conversations?.filter((c) => c?.type === "direct");
  const groupChats = conversations?.filter((c) => c?.type === "group");

  useEffect(() => {
    if (!currentUser?._id) return;

    fetchConversations(true);
    fetchUsers("", true);

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
      if (showLoader) setConversationsLoading(true);

      const res = await fetch(`/api/conversations?userId=${currentUser?._id}`);
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
        `/api/users?userId=${currentUser?._id}&search=${searchText}`
      );

      const result = await res.json();
      setUsers(result?.users || []);
    } catch (error) {
      console.error("Fetch users error:", error);
      setUsers([]);
    } finally {
      if (showLoader) setUsersLoading(false);
    }
  }

  async function startCallFromNetwork(receiverId, type) {
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "direct",
        currentUserId: currentUser?._id,
        receiverId,
      }),
    });

    const result = await res.json();

    if (result?.success) {
      const conversationId = result?.conversation?._id;

      const callRes = await fetch("/api/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          callerId: currentUser?._id,
          type,
        }),
      });

      const callResult = await callRes.json();

      if (callResult?.success) {
        window.location.href =
          `/call?room=${conversationId}` +
          `&type=${type}` +
          `&callId=${callResult?.call?._id}`;
      }
    }
  }

  async function startDirectChat(receiverId) {
    try {
      const res = await fetch("/api/conversations", {
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
      onRefresh?.();

      router.push(`/chat?conversationId=${result?.conversation?._id}`);

      setTimeout(() => {
        fetchConversations(false);
      }, 300);
    } catch (error) {
      console.error("Start direct chat error:", error);
      alert("Something went wrong");
    }
  }

  async function deleteConversation(conversationId) {
    const ok = confirm("Remove this chat?");
    if (!ok) return;

    const res = await fetch(
      `/api/conversations?conversationId=${conversationId}&userId=${currentUser?._id}`,
      { method: "DELETE" }
    );

    const result = await res.json();

    if (result?.success) {
      onRefresh?.();
      onSelectConversation(null);
      router.push("/chat");
      fetchConversations(false);
    }
  }

  function handleEditProfile() {
    setShowProfileMenu(false);
    router.push("/profile");
  }

  function handleLogout() {
    localStorage.clear();
    document.cookie = "token=; path=/; max-age=0";
    router.push("/login");
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
      });

      const result = await res.json();

      if (!result?.success) {
        alert(result?.error || "Delete failed");
        return;
      }

      localStorage.clear();
      document.cookie = "token=; path=/; max-age=0";

      alert("Account deleted successfully");
      router.replace("/login");
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
      )}&background=00a884&color=fff`
    );
  }

  function getConversationName(conversation) {
    if (conversation?.type === "group") return conversation?.name;

    const receiver = conversation?.members?.find(
      (member) => member?._id !== currentUser?._id
    );

    return receiver?.name || "Unknown User";
  }

  function getConversationAvatar(conversation) {
    if (conversation?.type === "group") {
      return (
        conversation?.avatar ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(
          conversation?.name || "Group"
        )}&background=00a884&color=fff`
      );
    }

    const receiver = conversation?.members?.find(
      (member) => member?._id !== currentUser?._id
    );

    return getUserAvatar(receiver);
  }

  async function handleConversationClick(conversation) {
    await fetch("/api/messages/read", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        conversationId: conversation?._id,
        userId: currentUser?._id,
      }),
    });

    onSelectConversation(conversation);
    setMobileChatOpen?.(true);
    router.push(`/chat?conversationId=${conversation?._id}`);
    fetchConversations(false);
  }

  function renderConversationItem(conversation) {
    const active = selectedConversation?._id === conversation?._id;
    const isMenuOpen = openChatMenuId === conversation?._id;

    const lastSenderId =
      conversation?.lastMessage?.sender?._id ||
      conversation?.lastMessage?.sender;

    const lastMessageText =
      lastSenderId === currentUser?._id
        ? `You: ${conversation?.lastMessage?.text || "File"}`
        : conversation?.lastMessage?.text || "No messages yet";

    return (
      <div
        key={conversation?._id}
        className={`d-flex align-items-center px-3 py-2 sidebar-chat-item position-relative ${
          active ? "active" : ""
        }`}
      >
        <button
          type="button"
          onClick={() => handleConversationClick(conversation)}
          className="btn p-0 flex-grow-1 d-flex align-items-center text-start border-0 text-white overflow-hidden"
        >
          <img
            src={getConversationAvatar(conversation)}
            className="rounded-circle object-fit-cover flex-shrink-0"
            width="48"
            height="48"
            alt="avatar"
            onClick={(e) => {
              e.stopPropagation();
              setPreviewImage(getConversationAvatar(conversation));
            }}
          />

          <div className="ms-3 flex-grow-1 overflow-hidden">
            <div className="fw-bold text-white text-truncate">
              {getConversationName(conversation)}
            </div>

            <div className="text-secondary text-truncate" style={{ fontSize: 13 }}>
              {lastMessageText}
            </div>
          </div>

          <div
            className="d-flex flex-column align-items-center justify-content-center gap-2 ms-2"
            style={{ minWidth: 48 }}
          >
            {conversation?.unreadCount > 0 && (
              <span
                className="bg-success text-white rounded-circle d-flex align-items-center justify-content-center fw-bold"
                style={{
                  width: 24,
                  height: 24,
                  fontSize: 12,
                }}
              >
                {conversation?.unreadCount > 99
                  ? "99+"
                  : conversation?.unreadCount}
              </span>
            )}
          </div>
        </button>

        <div
          ref={isMenuOpen ? chatMenuRef : null}
          className="position-relative"
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpenChatMenuId((prev) =>
                prev === conversation?._id ? null : conversation?._id
              );
            }}
            className="btn btn-sm btn-dark ms-2 rounded-circle d-flex align-items-center justify-content-center"
            style={{ width: 34, height: 34 }}
            title="More"
          >
            <FaEllipsisV size={12} />
          </button>

          {isMenuOpen && (
            <div
              className="position-absolute end-0 top-100 mt-2 bg-dark border border-secondary rounded-4 shadow-lg overflow-hidden"
              style={{
                width: 190,
                zIndex: 9999,
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setOpenChatMenuId(null);
                  deleteConversation(conversation?._id);
                }}
                className="btn btn-dark w-100 text-start border-0 rounded-0 px-3 py-3 text-danger d-flex align-items-center gap-2"
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
    <aside className="sidebar-shell d-flex flex-column h-100 w-100">
      <header className="sidebar-header d-flex align-items-center justify-content-between px-3 py-3">
        <div
          ref={profileMenuRef}
          className="d-flex align-items-center gap-3 position-relative"
        >
          <button
            type="button"
            onClick={() => setShowProfileMenu((prev) => !prev)}
            className="btn p-0 border-0 rounded-circle flex-shrink-0"
            title="Profile"
          >
            <img
              src={getUserAvatar(currentUser)}
              className="rounded-circle object-fit-cover profile-avatar"
              width="44"
              height="44"
              alt="profile"
            />
          </button>

          {showProfileMenu && (
            <div className="profile-menu shadow-lg">
              <button
                type="button"
                onClick={() =>
                  setPreviewImage(
                    currentUser?.avatar || getUserAvatar(currentUser)
                  )
                }
                className="profile-menu-item d-flex align-items-center"
              >
                <FaEye className="me-2" />
                View Profile
              </button>

              <button
                type="button"
                onClick={handleEditProfile}
                className="profile-menu-item d-flex align-items-center"
              >
                <FaUserEdit className="me-2" />
                Edit Profile
              </button>

              <button
                type="button"
                onClick={handleDeleteAccount}
                className="profile-menu-item text-danger d-flex align-items-center"
              >
                <FaTrashAlt className="me-2" />
                Delete Account
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="profile-menu-item text-danger d-flex align-items-center"
              >
                <FaSignOutAlt className="me-2" />
                Logout
              </button>
            </div>
          )}

          <div className="overflow-hidden">
            <h6 className="mb-0 fw-bold text-white text-truncate">
              {currentUser?.name || "User"}
            </h6>
            <small className="text-secondary">ChatterBox Pro Max</small>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowGroup(true)}
          className="btn btn-success rounded-circle d-flex align-items-center justify-content-center sidebar-icon-btn"
          title="Create Group"
        >
          <FaPlus />
        </button>
      </header>

      <div className="px-3 py-3 sidebar-search-wrap">
        <div className="input-group sidebar-search">
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

      <div className="px-3 pb-3">
        <button
          type="button"
          onClick={() => setShowNetwork(true)}
          className="btn btn-success w-100 rounded-4 py-3 fw-bold d-flex align-items-center justify-content-center gap-2"
          disabled={usersLoading}
        >
          <FaUserFriends />
          {usersLoading ? "Loading Network..." : "Our Network"}
        </button>
      </div>

      <section className="sidebar-scroll flex-grow-1 overflow-auto">
        <div className="sidebar-section-title px-3 pt-2 pb-2 d-flex align-items-center gap-2">
          <FaUsers />
          Groups
        </div>

        {conversationsLoading ? (
          <SidebarSkeleton count={3} />
        ) : groupChats?.length > 0 ? (
          groupChats.map((conversation) => renderConversationItem(conversation))
        ) : (
          <p className="px-3 py-2 small text-secondary mb-0">No groups yet</p>
        )}

        <div className="sidebar-section-title px-3 pt-3 pb-2 d-flex align-items-center gap-2">
          <FaComments />
          Chats
        </div>

        {conversationsLoading ? (
          <SidebarSkeleton count={5} />
        ) : privateChats?.length > 0 ? (
          privateChats.map((conversation) =>
            renderConversationItem(conversation)
          )
        ) : (
          <p className="px-3 py-2 small text-secondary mb-0">No chats yet</p>
        )}
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

function SidebarSkeleton({ count = 4 }) {
  return (
    <div className="px-3 py-1">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="d-flex align-items-center gap-3 py-2 sidebar-skeleton-row"
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