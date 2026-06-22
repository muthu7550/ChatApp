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
  FaTrash,
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
  const [showGroup, setShowGroup] = useState(false);
  const [search, setSearch] = useState("");
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNetwork, setShowNetwork] = useState(false);

  const privateChats = conversations?.filter((c) => c?.type === "direct");
  const groupChats = conversations?.filter((c) => c?.type === "group");
  const profileMenuRef = useRef(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [openChatMenuId, setOpenChatMenuId] = useState(null);
  const chatMenuRef = useRef(null);

  useEffect(() => {
    if (!currentUser?._id) return;

    fetchConversations();
    fetchUsers("");

    const interval = setInterval(() => {
      fetchConversations();
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
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);

      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  async function fetchConversations() {
    const res = await fetch(`/api/conversations?userId=${currentUser?._id}`);
    const result = await res.json();
    setConversations(result?.conversations || []);
  }

  async function fetchUsers(searchText = "") {
    const res = await fetch(
      `/api/users?userId=${currentUser?._id}&search=${searchText}`,
    );
    const result = await res.json();
    setUsers(result?.users || []);
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
          (item) => item?._id === result?.conversation?._id,
        );

        if (exists) {
          return prev.map((item) =>
            item?._id === result?.conversation?._id
              ? result?.conversation
              : item,
          );
        }

        return [result?.conversation, ...prev];
      });

      onSelectConversation(result?.conversation);
      setMobileChatOpen?.(true);
      onRefresh?.();

      router.push(`/chat?conversationId=${result?.conversation?._id}`);

      setTimeout(() => {
        fetchConversations();
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
      { method: "DELETE" },
    );

    setTimeout(() => {
      fetchConversations();
    }, 300);

    const result = await res.json();

    if (result?.success) {
      onRefresh();
      onSelectConversation(null);
      router.push("/chat");
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
      "Are you sure? This will permanently delete your account, chats, messages and groups.",
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
        user?.name || "User",
      )}&background=00a884&color=fff`
    );
  }

  function getConversationName(conversation) {
    if (conversation?.type === "group") return conversation?.name;

    const receiver = conversation?.members?.find(
      (member) => member?._id !== currentUser?._id,
    );

    return receiver?.name || "Unknown User";
  }

  function getConversationAvatar(conversation) {
    if (conversation?.type === "group") {
      return (
        conversation?.avatar ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(
          conversation?.name || "Group",
        )}&background=00a884&color=fff`
      );
    }

    const receiver = conversation?.members?.find(
      (member) => member?._id !== currentUser?._id,
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
    fetchConversations();
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

            <div
              className="text-secondary text-truncate"
              style={{
                fontSize: "13px",
              }}
            >
              {lastMessageText}
            </div>
          </div>

          <div
            className="d-flex flex-column align-items-center justify-content-center gap-2 ms-2"
            style={{
              minWidth: "48px",
            }}
          >
            {conversation?.unreadCount > 0 && (
              <span
                className="bg-success text-white rounded-circle d-flex align-items-center justify-content-center fw-bold"
                style={{
                  width: "24px",
                  height: "24px",
                  fontSize: "12px",
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
                prev === conversation?._id ? null : conversation?._id,
              );
            }}
            className="btn btn-sm btn-dark ms-2 rounded-circle d-flex align-items-center justify-content-center"
            style={{
              width: 34,
              height: 34,
            }}
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
                    currentUser?.avatar ||
                      "data:image/jpeg;base64,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",
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
              fetchUsers(value);
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
        >
          <FaUserFriends />
          Our Network
        </button>
      </div>

      <section className="sidebar-scroll flex-grow-1 overflow-auto">
        <div className="sidebar-section-title px-3 pt-2 pb-2 d-flex align-items-center gap-2">
          <FaUsers />
          Groups
        </div>

        {groupChats?.length > 0 ? (
          groupChats.map((conversation) => renderConversationItem(conversation))
        ) : (
          <p className="px-3 py-2 small text-secondary mb-0">No groups yet</p>
        )}

        <div className="sidebar-section-title px-3 pt-3 pb-2 d-flex align-items-center gap-2">
          <FaComments />
          Chats
        </div>

        {privateChats?.length > 0 ? (
          privateChats.map((conversation) =>
            renderConversationItem(conversation),
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
            fetchConversations();
          }}
        />
      )}

      {previewImage && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 bg-black bg-opacity-100 d-flex align-items-center justify-content-center"
          style={{
            zIndex: 99999,
          }}
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
