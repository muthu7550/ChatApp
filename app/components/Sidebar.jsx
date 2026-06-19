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

  useEffect(() => {
    if (!currentUser?._id) return;
    fetchConversations();
    fetchUsers("");
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

  function handleConversationClick(conversation) {
    onSelectConversation(conversation);
    setMobileChatOpen?.(true);
    router.push(`/chat?conversationId=${conversation?._id}`);
  }

  function renderConversationItem(conversation) {
    const active = selectedConversation?._id === conversation?._id;

    return (
      <div
        key={conversation?._id}
        className={`d-flex align-items-center px-3 py-2 sidebar-chat-item ${
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
          />

          <div className="ms-3 overflow-hidden flex-grow-1">
            <div className="d-flex align-items-center justify-content-between gap-2">
              <h6 className="mb-0 text-truncate fw-semibold">
                {getConversationName(conversation)}
              </h6>

              {conversation?.unreadCount > 0 && (
                <span className="badge rounded-pill text-bg-success">
                  {conversation?.unreadCount}
                </span>
              )}
            </div>

            <small className="text-secondary d-block text-truncate mt-1">
              {conversation?.lastMessage?.sender === currentUser?._id
                ? `You: ${conversation?.lastMessage?.text || "File"}`
                : conversation?.lastMessage?.text || "No messages yet"}
            </small>
          </div>
        </button>

        <button
          type="button"
          onClick={() => deleteConversation(conversation?._id)}
          className="btn btn-sm btn-outline-danger ms-2 rounded-circle sidebar-delete-btn"
          title="Delete chat"
        >
          <FaTrash size={12} />
        </button>
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
                onClick={handleEditProfile}
                className="profile-menu-item d-flex align-items-center"
              >
                <FaUserEdit className="me-2" />
                Edit Profile
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
