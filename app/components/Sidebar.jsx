"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  FaEye,
  FaTrashAlt,
  FaPhoneSlash,
  FaEllipsisV,
  FaChevronDown,
  FaUserFriends,
} from "react-icons/fa";

import { ChatAvatar } from "./Avatar";
import { FaPhoneAlt, FaVideo, FaPhoneVolume } from "react-icons/fa";

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
  const [activeFilter, setActiveFilter] = useState("all");

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [openChatMenuId, setOpenChatMenuId] = useState(null);
  const [openCallMenuId, setOpenCallMenuId] = useState(null);

  const [groupsOpen, setGroupsOpen] = useState(true);
  const [chatsOpen, setChatsOpen] = useState(true);

  const profileMenuRef = useRef(null);
  const chatMenuRef = useRef(null);
  const conversationFetchRunningRef = useRef(false);
  const usersFetchRunningRef = useRef(false);
  const callsFetchRunningRef = useRef(false);

  const [conversationsFetched, setConversationsFetched] = useState(false);
  const [usersFetched, setUsersFetched] = useState(false);
  const [callsFetched, setCallsFetched] = useState(false);

  const orangeGradient = "linear-gradient(135deg, #ff9d2e, #ff5b2f)";

  const privateChats = conversations.filter((c) => c?.type === "direct");
  const groupChats = conversations.filter((c) => c?.type === "group");
  const privateUnreadCount = privateChats.reduce(
    (total, chat) => total + Number(chat?.unreadCount || 0),
    0,
  );

  const groupUnreadCount = groupChats.reduce(
    (total, group) => total + Number(group?.unreadCount || 0),
    0,
  );

  const searchValue = search.trim().toLowerCase();
  const isSearching = searchValue.length > 0;

  const [calls, setCalls] = useState([]);
  const [missedCallCount, setMissedCallCount] = useState(0);

  const searchedChats = useMemo(() => {
    if (!searchValue) return [];

    return conversations.filter((conversation) =>
      getConversationName(conversation).toLowerCase().includes(searchValue),
    );
  }, [conversations, searchValue, currentUser?._id]);

  const existingDirectUserIds = useMemo(() => {
    return new Set(
      privateChats
        .map((chat) => {
          const receiver = chat?.members?.find(
            (member) => member?._id !== currentUser?._id,
          );
          return receiver?._id;
        })
        .filter(Boolean),
    );
  }, [privateChats, currentUser?._id]);

  const searchedNetworkUsers = useMemo(() => {
    if (!searchValue) return [];

    return users.filter(
      (user) =>
        user?._id &&
        user?._id !== currentUser?._id &&
        !existingDirectUserIds.has(user?._id) &&
        user?.name?.toLowerCase().includes(searchValue),
    );
  }, [users, searchValue, currentUser?._id, existingDirectUserIds]);

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
        "Your session has expired. Please login again.",
      );
      router.push("/auth/login");
      return true;
    }

    return false;
  }

  useEffect(() => {
    if (!currentUser?._id) return;

    fetchConversations(!conversationsFetched);
    fetchUsers("", !usersFetched);
    fetchCalls();

    const interval = setInterval(() => {
      fetchConversations(false);
    }, 5000);

    const callInterval = setInterval(() => {
      fetchCalls();
    }, 10000);

    return () => {
      clearInterval(interval);
      clearInterval(callInterval);
    };
  }, [currentUser?._id, refreshKey]);

  useEffect(() => {
    if (!currentUser?._id) return;

    const timer = setTimeout(() => {
      fetchUsers(search, false);
    }, 450);

    return () => clearTimeout(timer);
  }, [search, currentUser?._id]);

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
    if (!currentUser?._id || conversationFetchRunningRef.current) return;

    try {
      conversationFetchRunningRef.current = true;

      if (showLoader && !conversationsFetched) {
        setConversationsLoading(true);
      }

  const res = await fetch(
`/api/conversations?userId=${currentUser._id}&conversationId=${selectedConversation?._id || ""}&t=${Date.now()}`,
  {
    headers: {
      ...getAuthHeaders(),
      "Cache-Control": "no-store",
    },
    cache: "no-store",
  }
);

      if (await handleUnauthorized(res)) return;

      const result = await res.json().catch(() => null);

      if (result?.success) {
        setConversations(result?.conversations || []);
      }
    } catch (error) {
      console.error("Fetch conversations error:", error);
    } finally {
      setConversationsFetched(true);
      setConversationsLoading(false);
      conversationFetchRunningRef.current = false;
    }
  }

  async function fetchUsers(searchText = "", showLoader = false) {
    if (!currentUser?._id || usersFetchRunningRef.current) return;

    try {
      usersFetchRunningRef.current = true;

      if (showLoader && !usersFetched) {
        setUsersLoading(true);
      }

      const res = await fetch(
        `/api/users?userId=${currentUser._id}&search=${encodeURIComponent(searchText)}`,
        {
          headers: getAuthHeaders(),
        },
      );

      if (await handleUnauthorized(res)) return;

      const result = await res.json().catch(() => null);

      if (result?.success || result?.users) {
        setUsers(result?.users || []);
      }
    } catch (error) {
      console.error("Fetch users error:", error);
    } finally {
      setUsersFetched(true);
      setUsersLoading(false);
      usersFetchRunningRef.current = false;
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
    setSearch("");

    const safeConversation = {
      ...result.conversation,
      lastMessage: null,
      unreadCount: 0,
    };

    setConversations((prev) => {
      const exists = prev.some(
        (item) => item?._id === safeConversation?._id,
      );

      if (exists) {
        return prev.map((item) =>
          item?._id === safeConversation?._id ? safeConversation : item,
        );
      }

      return [safeConversation, ...prev];
    });

    onSelectConversation(safeConversation);
    setMobileChatOpen?.(true);
    router.push(`/chat?conversationId=${safeConversation?._id}`);
    onRefresh?.();

    setTimeout(() => {
      fetchConversations(false);
    }, 300);
  } catch (error) {
    console.error("Start direct chat error:", error);
    alert("Something went wrong");
  }
}

  async function fetchCalls() {
    if (!currentUser?._id || callsFetchRunningRef.current) return;

    try {
      callsFetchRunningRef.current = true;

      const res = await fetch(`/api/calls?userId=${currentUser._id}`, {
        headers: getAuthHeaders(),
      });

      if (await handleUnauthorized(res)) return;

      const result = await res.json().catch(() => null);

      setCalls(result?.calls || []);
      setMissedCallCount(result?.missedCount || 0);
    } catch (error) {
      console.error("Fetch calls error:", error);
    } finally {
      setCallsFetched(true);
      callsFetchRunningRef.current = false;
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
  const conversation = conversations.find(
    (item) => item?._id === conversationId,
  );

  const isGroup = conversation?.type === "group";

  const ok = confirm(isGroup ? "Leave this group?" : "Delete this chat?");
  if (!ok) return;

  const token = localStorage.getItem("token");

  const res = isGroup
    ? await fetch("/api/groups", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          conversationId,
          userId: currentUser?._id,
          action: "leave_group",
        }),
      })
    : await fetch(
        `/api/conversations?conversationId=${conversationId}&userId=${currentUser?._id}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        },
      );

  if (await handleUnauthorized(res)) return;

  const result = await res.json().catch(() => null);

  if (!res.ok || !result?.success) {
    alert(result?.error || (isGroup ? "Leave group failed" : "Delete chat failed"));
    return;
  }

  setConversations((prev) =>
    prev.filter((item) => item?._id !== conversationId),
  );

  setCalls((prev) =>
    prev.filter((call) => {
      const callConversationId = call?.conversation?._id || call?.conversation;
      return callConversationId !== conversationId;
    }),
  );

  setOpenChatMenuId(null);
  onRefresh?.();
  onSelectConversation(null);
  setMobileChatOpen?.(false);
  router.replace("/chat");

  fetchConversations(false);
  fetchCalls();
}

  async function clearConversationsByType(type) {
    const label = type === "group" ? "groups" : "chats";
    const ok = confirm(`Clear all ${label}?`);
    if (!ok) return;

    const res = await fetch(
      `/api/conversations/clear?userId=${currentUser?._id}&type=${type}`,
      {
        method: "DELETE",
        headers: getAuthHeaders(),
      },
    );

    if (await handleUnauthorized(res)) return;

    const result = await res.json();

    if (result?.success) {
      setConversations((prev) => prev.filter((item) => item?.type !== type));
      onSelectConversation(null);
      setMobileChatOpen?.(false);
      router.push("/chat");
      onRefresh?.();
      fetchConversations(false);
    } else {
      alert(result?.error || `Clear ${label} failed`);
    }
  }

  async function clearCalls() {
    const ok = confirm("Clear all calls?");
    if (!ok) return;

    const res = await fetch(`/api/calls/clear?userId=${currentUser?._id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    if (await handleUnauthorized(res)) return;

    const result = await res.json();

    if (result?.success) {
      setCalls([]);
      setMissedCallCount(0);
    } else {
      alert(result?.error || "Clear calls failed");
    }
  }

  async function deleteCall(callId) {
    const ok = confirm("Remove this call?");
    if (!ok) return;

    const res = await fetch(
      `/api/calls?callId=${callId}&userId=${currentUser?._id}`,
      {
        method: "DELETE",
        headers: getAuthHeaders(),
      },
    );

    if (await handleUnauthorized(res)) return;

    const result = await res.json();

    if (result?.success) {
      setCalls((prev) => prev.filter((item) => item?._id !== callId));
      fetchCalls();
    } else {
      alert(result?.error || "Delete call failed");
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

    setSearch("");
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
      "Are you sure? This will permanently delete your account, chats, messages and groups.",
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

  async function openCallConversation(call) {
    const conversationId = call?.conversation?._id || call?.conversation;

    if (!conversationId) {
      alert("Conversation not found");
      return;
    }

    const res = await fetch("/api/conversations/restore", {
      method: "POST",
      headers: getAuthHeaders({
        "Content-Type": "application/json",
      }),
      body: JSON.stringify({
        conversationId,
        userId: currentUser?._id,
      }),
    });

    const result = await res.json();

    if (!res.ok || !result?.success) {
      alert(result?.error || "Chat not available");
      return;
    }

    onSelectConversation(result.conversation);
    setMobileChatOpen?.(true);
    router.push(`/chat?conversationId=${conversationId}`);
    fetchConversations(false);
  }

  function getUserAvatar(user) {
    return (
      user?.avatar ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(
        user?.name || "User",
      )}&background=ff6b2c&color=ffffff&bold=true`
    );
  }

  function getConversationName(conversation) {
    if (conversation?.type === "group") return conversation?.name || "Group";

    const receiver = conversation?.members?.find(
      (member) => member?._id !== currentUser?._id,
    );

    return receiver?.name || "Unknown User";
  }

  function renderConversationItem(conversation) {
    const active = selectedConversation?._id === conversation?._id;
    const isMenuOpen = openChatMenuId === conversation?._id;

    const lastSenderId =
      conversation?.lastMessage?.sender?._id ||
      conversation?.lastMessage?.sender;

const hasVisibleLastMessage = Boolean(conversation?.lastMessage);

const wasClearedOrDeleted =
  conversation?.clearedFor?.some?.(
    (item) => item?.user?.toString() === currentUser?._id?.toString()
  ) || false;

const lastMessageText =
  wasClearedOrDeleted && !hasVisibleLastMessage
    ? "No messages yet"
    : !hasVisibleLastMessage
      ? "No messages yet"
      : lastSenderId === currentUser?._id
        ? `You: ${conversation?.lastMessage?.text || "File"}`
        : conversation?.lastMessage?.text || "File";

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

            <div
              className="text-secondary text-truncate"
              style={{ fontSize: 13 }}
            >
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

          {conversation?.type === "group" &&
            conversation?.pendingJoinCount > 0 && (
              <span
                className="text-white rounded-pill d-flex align-items-center justify-content-center fw-bold ms-2 px-2"
                style={{
                  minWidth: 24,
                  height: 24,
                  fontSize: 11,
                  background: "#f97316",
                }}
              >
                {conversation.pendingJoinCount} req
              </span>
            )}
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
            className="btn btn-sm ms-2 rounded-circle d-flex align-items-center justify-content-center border-0 text-secondary"
            style={{ width: 34, height: 34 }}
          >
            <FaEllipsisV size={12} />
          </button>

          {isMenuOpen && (
            <div
              className="chat-action-menu bg-white border rounded-4 shadow-lg overflow-hidden"
              style={{ width: 190 }}
            >
              <button
                type="button"
                onClick={() => {
                  setOpenChatMenuId(null);
                  deleteConversation(conversation?._id);
                }}
                className="btn w-100 text-start border-0 rounded-0 px-3 py-3 text-danger d-flex align-items-center gap-2"
              >
                {conversation?.type === "group" ? (
                  <>
                    <FaSignOutAlt size={14} />
                    <span className="small fw-semibold">Leave group</span>
                  </>
                ) : (
                  <>
                    <FaTrashAlt size={14} />
                    <span className="small fw-semibold">
                      {conversation?.type === "group"
                        ? "Leave group"
                        : "Delete chat"}
                    </span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  function renderNetworkUser(user) {
    return (
      <button
        key={user?._id}
        type="button"
        onClick={() => startDirectChat(user?._id)}
        className="network-result-item"
      >
        <img src={getUserAvatar(user)} alt={user?.name || "User"} />

        <div className="flex-grow-1 overflow-hidden">
          <div className="fw-bold text-dark text-truncate">
            {user?.name || "User"}
          </div>
          <small className="text-secondary text-truncate d-block">
            From network
          </small>
        </div>

        <span className="network-start-pill">Chat</span>
      </button>
    );
  }

  return (
    <aside className="sidebar-shell d-flex flex-column h-100 w-100 position-relative">
      <style>{`
    .sidebar-shell {
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background:
    radial-gradient(circle at 0% 0%, rgba(255,157,46,.28), transparent 34%),
    radial-gradient(circle at 100% 16%, rgba(255,91,47,.16), transparent 28%),
    linear-gradient(180deg, #fff7f1 0%, #ffffff 46%, #fffaf7 100%);
  color: #111827;
}

.sidebar-fixed-top {
  flex-shrink: 0;
  background: linear-gradient(180deg, #fff7f1 0%, #ffffff 100%);
  z-index: 30;
}

.sidebar-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
}

.tab-missed-badge {
  margin-left: 6px;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #ef4444;
  color: #ffffff;
  font-size: 11px;
  font-weight: 900;
}

        .sidebar-header {
          background: linear-gradient(135deg, #fff1e7, #ffffff);
          border-bottom: 1px solid #ffd9c7 !important;
        }

        .profile-avatar-ring {
          padding: 3px;
          border-radius: 999px;
          background: linear-gradient(135deg, #ff9d2e, #ff5b2f);
        }

        .network-svg-btn {
          width: 44px;
          height: 44px;
          border: 0;
          border-radius: 16px;
          display: grid;
          place-items: center;
          color: #ffffff;
          background: linear-gradient(135deg, #ff9d2e, #ff5b2f);
          box-shadow: 0 12px 26px rgba(255, 91, 47, 0.3);
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
        }

        .sidebar-profile-menu-item:hover {
          background: #fff4ec;
          color: #ff5b2f;
        }

        .sidebar-search {
          background: #ffffff;
           border: 2px solid;
          border-color: #ff5b2f !important;
          overflow: hidden;
          box-shadow: 0 10px 25px rgba(255, 91, 47, 0.08);
        }

        .sidebar-search:focus-within {
          border-color: #ff5b2f !important;
          box-shadow: 0 0 0 4px rgba(255, 91, 47, 0.12);
        }

        .sidebar-search .input-group-text {
          background: #ffffff;
          border: 0;
          color: #ff5b2f;
          padding-left: 16px;
        }

        .sidebar-search .form-control {
          background: #ffffff;
          border: 0;
          box-shadow: none !important;
          outline: none !important;
          color: #111827;
        }

        .sidebar-search .form-control:focus {
          box-shadow: none !important;
        }

        .chat-filter-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
        }

        .chat-filter-btn {
          border: 1px solid #ffd7c2;
          border-radius: 999px;
          padding: 10px 12px;
          background: #ffffff;
          color: #ff5b2f;
          font-size: 13px;
          font-weight: 900;
        }

        .chat-filter-btn.active {
          color: #ffffff;
          background: linear-gradient(135deg, #ff9d2e, #ff5b2f);
          box-shadow: 0 10px 20px rgba(255, 91, 47, 0.22);
        }

        .sidebar-accordion-card,
        .search-result-card {
          border: 1px solid #ffd9c7;
          border-radius: 20px;
          overflow: hidden;
          background: #ffffff;
          margin: 0 12px 12px;
          box-shadow: 0 12px 28px rgba(255, 91, 47, 0.08);
        }

        .sidebar-accordion-head,
        .search-result-head {
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
          background: rgba(255, 255, 255, 0.78);
          transition: 0.2s ease;
          border-bottom: 1px solid #fff1e7;
        }

        .sidebar-chat-item:hover {
          background: #fff1e7;
        }

        .sidebar-chat-item.active {
          background: linear-gradient(135deg, #fff1e7, #ffe3d3);
          border-left: 4px solid #ff5b2f;
        }

        .network-result-item {
          width: 100%;
          border: 0;
          background: #ffffff;
          padding: 11px 14px;
          display: flex;
          align-items: center;
          gap: 12px;
          text-align: left;
          border-bottom: 1px solid #fff1e7;
        }

        .network-result-item:hover {
          background: #fff7f1;
        }

        .network-result-item img {
          width: 44px;
          height: 44px;
          border-radius: 999px;
          object-fit: cover;
        }

        .network-start-pill {
          border-radius: 999px;
          padding: 7px 12px;
          font-size: 12px;
          font-weight: 900;
          color: #ffffff;
          background: linear-gradient(135deg, #ff9d2e, #ff5b2f);
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

      <div className="sidebar-fixed-top">
        <header className="sidebar-header d-flex align-items-center justify-content-between px-3 py-3">
          <div
            ref={profileMenuRef}
            className="d-flex align-items-center gap-3 position-relative overflow-visible min-w-0"
          >
            <button
              type="button"
              onClick={() => setShowProfileMenu((prev) => !prev)}
              className="btn p-0 border-0 rounded-circle flex-shrink-0"
              title="Profile"
            >
              <span className="profile-avatar-ring d-inline-flex">
                <img
                  src={getUserAvatar(currentUser)}
                  className="rounded-circle object-fit-cover"
                  width="44"
                  height="44"
                  alt="profile"
                />
              </span>
            </button>

            {showProfileMenu && (
              <div className="sidebar-profile-menu">
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(false);
                    setPreviewImage(
                      currentUser?.avatar || getUserAvatar(currentUser),
                    );
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

          <button
            type="button"
            onClick={() => setShowNetwork(true)}
            className="network-svg-btn flex-shrink-0"
            title="Our Network"
            disabled={usersLoading}
          >
            <svg width="23" height="23" viewBox="0 0 24 24" fill="none">
              <circle
                cx="6"
                cy="7"
                r="3"
                stroke="currentColor"
                strokeWidth="2"
              />
              <circle
                cx="18"
                cy="7"
                r="3"
                stroke="currentColor"
                strokeWidth="2"
              />
              <circle
                cx="12"
                cy="17"
                r="3"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M8.5 9.5L10.5 14M15.5 9.5L13.5 14"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </header>

        <div className="p-3 search-wrapper">
          <div className="input-group sidebar-search  border border-red-100 rounded-4">
            <span className="input-group-text rounded-start-pill">
              <FaSearch />
            </span>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search chats or network users..."
              className="form-control rounded-end-pill"
            />
          </div>
        </div>

        {!isSearching && (
          <div className="chat-filter-row px-3 pb-3">
            {[
              { key: "all", label: "All" },
              {
                key: "chats",
                label: (
                  <>
                    Chats
                    {privateUnreadCount > 0 && (
                      <span className="tab-missed-badge">
                        {privateUnreadCount}
                      </span>
                    )}
                  </>
                ),
              },
              {
                key: "groups",
                label: (
                  <>
                    Groups
                    {groupUnreadCount > 0 && (
                      <span className="tab-missed-badge">
                        {groupUnreadCount}
                      </span>
                    )}
                  </>
                ),
              },
              {
                key: "calls",
                label: (
                  <>
                    Calls
                    {missedCallCount > 0 && (
                      <span className="tab-missed-badge">
                        {missedCallCount}
                      </span>
                    )}
                  </>
                ),
              },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setActiveFilter(item.key)}
                className={`chat-filter-btn ${
                  activeFilter === item.key ? "active" : ""
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <section className="sidebar-scroll flex-grow-1 overflow-auto pb-3">
        {activeFilter === "calls" && !isSearching && (
          <div className="search-result-card">
            <div className="search-result-head">
              <span>
                <FaPhoneAlt className="me-2" />
                Calls
              </span>

              <span className="sidebar-accordion-actions">
                <button
                  type="button"
                  className="accordion-action-btn"
                  title="Clear calls"
                  onClick={clearCalls}
                  disabled={calls.length === 0}
                >
                  <FaTrashAlt size={13} />
                </button>

                <span className="badge bg-white text-dark rounded-pill">
                  {calls.length}
                </span>
              </span>
            </div>

            {!callsFetched ? (
              <SidebarSkeleton count={4} />
            ) : calls.length > 0 ? (
              calls.map((call) => {
                const isOutgoing = call?.caller?._id === currentUser?._id;
                const person = isOutgoing ? call?.receiver : call?.caller;
                const isCallMenuOpen = openCallMenuId === call?._id;

                return (
                  <div key={call?._id} className="position-relative">
                    <button
                      type="button"
                      className="network-result-item"
                      onClick={() => openCallConversation(call)}
                    >
                      <span
                        className="rounded-circle d-flex align-items-center justify-content-center text-white"
                        style={{
                          width: 44,
                          height: 44,
                          background:
                            call?.status === "missed"
                              ? "#ef4444"
                              : "linear-gradient(135deg,#ff9d2e,#ff5b2f)",
                        }}
                      >
                        {call?.type === "video" ? <FaVideo /> : <FaPhoneAlt />}
                      </span>

                      <div className="flex-grow-1 overflow-hidden">
                        <div className="fw-bold text-dark text-truncate">
                          {person?.name || "Unknown User"}
                        </div>

                        <small className="text-secondary d-block text-truncate">
                          {isOutgoing ? "Outgoing" : "Incoming"} {call?.type}{" "}
                          call · {call?.status}
                        </small>
                      </div>

                      {call?.status === "missed" && (
                        <FaPhoneSlash className="text-danger" />
                      )}

                      {call?.status === "accepted" && (
                        <FaPhoneVolume className="text-success" />
                      )}
                    </button>

                    <button
                      type="button"
                      className="btn btn-sm position-absolute top-50 end-0 translate-middle-y me-2 rounded-circle border-0 text-secondary"
                      style={{ width: 32, height: 32, background: "#fff7f1" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenCallMenuId((prev) =>
                          prev === call?._id ? null : call?._id,
                        );
                      }}
                    >
                      <FaEllipsisV size={12} />
                    </button>

                    {isCallMenuOpen && (
                      <div
                        className="chat-action-menu bg-white border rounded-4 shadow-lg overflow-hidden"
                        style={{ width: 170 }}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setOpenCallMenuId(null);
                            deleteCall(call?._id);
                          }}
                          className="btn w-100 text-start border-0 rounded-0 px-3 py-3 text-danger d-flex align-items-center gap-2"
                        >
                          <FaTrashAlt size={14} />
                          <span className="small fw-semibold">Delete call</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="empty-box">No calls yet</div>
            )}
          </div>
        )}

        {isSearching ? (
          <>
            <div className="search-result-card">
              <div className="search-result-head">
                <span>
                  <FaComments className="me-2" />
                  Matched Chats
                </span>
                <span className="badge bg-white text-dark rounded-pill">
                  {searchedChats.length}
                </span>
              </div>

              {searchedChats.length > 0 ? (
                searchedChats.map((conversation) =>
                  renderConversationItem(conversation),
                )
              ) : (
                <div className="empty-box">No chat matched</div>
              )}
            </div>

            <div className="search-result-card">
              <div className="search-result-head">
                <span>
                  <FaUserFriends className="me-2" />
                  Matched Network
                </span>
                <span className="badge bg-white text-dark rounded-pill">
                  {searchedNetworkUsers.length}
                </span>
              </div>

              {usersLoading ? (
                <SidebarSkeleton count={3} />
              ) : searchedNetworkUsers.length > 0 ? (
                searchedNetworkUsers.map((user) => renderNetworkUser(user))
              ) : (
                <div className="empty-box">No network user matched</div>
              )}
            </div>
          </>
        ) : (
          <>
            {activeFilter !== "calls" && activeFilter !== "chats" && (
              <AccordionSection
                title="Groups"
                icon={<FaUsers />}
                count={groupChats.length}
                open={groupsOpen}
                onToggle={() => setGroupsOpen((prev) => !prev)}
                actionIcon={<FaPlus />}
                onAction={() => setShowGroup(true)}
                clearIcon={null}
                onClear={null}
              >
                {!conversationsFetched || conversationsLoading ? (
                  <SidebarSkeleton count={3} />
                ) : groupChats.length > 0 ? (
                  groupChats.map((conversation) =>
                    renderConversationItem(conversation),
                  )
                ) : (
                  <div className="empty-box">
                    <div className="fw-bold text-dark mb-1">No groups yet</div>
                    <div className="small text-secondary mb-3">
                      Create your first group chat.
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowGroup(true)}
                      className="empty-action-btn"
                    >
                      <FaPlus className="me-2 d-inline-block" />
                      Create Group
                    </button>
                  </div>
                )}
              </AccordionSection>
            )}

            {activeFilter !== "calls" && activeFilter !== "groups" && (
              <AccordionSection
                title="Chats"
                icon={<FaComments />}
                count={privateChats.length}
                open={chatsOpen}
                onToggle={() => setChatsOpen((prev) => !prev)}
                actionIcon={<FaPlus />}
                onAction={() => setShowNetwork(true)}
                clearIcon={privateChats.length > 0 ? <FaTrashAlt /> : null}
                onClear={() => clearConversationsByType("direct")}
              >
                {!conversationsFetched || conversationsLoading ? (
                  <SidebarSkeleton count={5} />
                ) : privateChats.length > 0 ? (
                  privateChats.map((conversation) =>
                    renderConversationItem(conversation),
                  )
                ) : (
                  <div className="empty-box">
                    <div className="fw-bold text-dark mb-1">No chats yet</div>
                    <div className="small text-secondary mb-3">
                      Start a conversation with someone.
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowNetwork(true)}
                      className="empty-action-btn"
                    >
                      <FaPlus className="me-2 d-inline-block" />
                      New Chat
                    </button>
                  </div>
                )}
              </AccordionSection>
            )}
          </>
        )}
      </section>

      {showGroup && (
        <CreateGroupModal
          currentUser={currentUser}
          users={users}
          conversations={conversations}
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
  clearIcon,
  onClear,
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
          {clearIcon && (
            <span
              role="button"
              tabIndex={0}
              title={`Clear ${title}`}
              onClick={(e) => {
                e.stopPropagation();
                onClear?.();
              }}
              className="accordion-action-btn"
            >
              {clearIcon}
            </span>
          )}

          {actionIcon && (
            <span
              role="button"
              tabIndex={0}
              title={`Add ${title}`}
              onClick={(e) => {
                e.stopPropagation();
                onAction?.();
              }}
              className="accordion-action-btn"
            >
              {actionIcon}
            </span>
          )}

          <FaChevronDown
            className={`accordion-chevron ${open ? "open" : ""}`}
          />
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
