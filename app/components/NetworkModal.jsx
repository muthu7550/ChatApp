"use client";

import { useEffect, useRef, useState } from "react";
import {
  FaComments,
  FaEllipsisV,
  FaMicrophone,
  FaSearch,
  FaTimes,
  FaUserFriends,
  FaVideo,
} from "react-icons/fa";

export default function NetworkModal({
  currentUser,
  onClose,
  onStartChat,
  onStartCall,
}) {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    fetchUsers("");
  }, []);

  useEffect(() => {
    function handleClick() {
      setOpenMenuId(null);
    }

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  async function fetchUsers(searchText = "") {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      const res = await fetch(
        `/api/users?userId=${currentUser?._id || ""}&search=${encodeURIComponent(
          searchText
        )}`,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      );

      const result = await res.json();
      setUsers(result?.users || []);
    } catch (error) {
      console.error("Fetch users error:", error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(value) {
    setSearch(value);

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchUsers(value);
    }, 350);
  }

  function getAvatar(user) {
    return (
      user?.avatar ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(
        user?.name || "User"
      )}&background=ff6b2c&color=fff`
    );
  }

  function goToChat(userId) {
    if (!userId) return;
    onStartChat(userId);
  }

  function startCall(userId, type) {
    if (!userId) return;
    onStartCall(userId, type);
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/35 backdrop-blur-sm px-0 sm:px-4">
      <div className="w-full sm:max-w-[720px] h-[92vh] sm:h-auto sm:max-h-[90vh] overflow-hidden rounded-t-[28px] sm:rounded-[28px] bg-white shadow-2xl border border-gray-100 d-flex flex-column">
        <header className="d-flex align-items-center justify-content-between px-3 px-sm-5 py-3 py-sm-4 border-bottom bg-white">
          <div className="d-flex align-items-center gap-3 min-w-0">
            <div className="h-11 w-11 sm:h-12 sm:w-12 rounded bg-orange-50 text-orange-500 d-flex align-items-center justify-content-center flex-shrink-0">
              <FaUserFriends size={20} />
            </div>

            <div className="min-w-0">
              <h4 className="mb-0 fw-bold text-gray-900 text-truncate text-base sm:text-xl">
                Our Network
              </h4>
              <small className="text-gray-500 d-none d-sm-block">
                Search users and connect instantly
              </small>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="h-10 w-10 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 d-flex align-items-center justify-content-center border-0 transition flex-shrink-0"
          >
            <FaTimes />
          </button>
        </header>

        <div className="px-3 px-sm-5 py-3 py-sm-4 bg-[#fafafa] border-bottom">
          <div className="position-relative">
            <FaSearch className="position-absolute top-50 start-0 translate-middle-y ms-4 text-gray-400" />

            <input
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search user by name..."
              className="form-control border-0 bg-white rounded-pill ps-5 py-3 text-gray-800 shadow-sm"
            />
          </div>
        </div>

        <div className="overflow-auto p-3 p-sm-5 bg-[#fafafa] flex-grow-1">
          {loading ? (
            <NetworkSkeleton />
          ) : users.length > 0 ? (
            <div className="d-flex flex-column gap-3">
              {users.map((user) => (
                <div
                  key={user?._id}
                  className="position-relative d-flex align-items-center gap-3 rounded-[22px] bg-white p-3 shadow-sm border border-gray-100 hover:bg-gray-50 transition"
                >
                  <div
                    onClick={() => goToChat(user?._id)}
                    className="d-flex align-items-center gap-3 flex-grow-1 overflow-hidden cursor-pointer"
                  >
                    <img
                      src={getAvatar(user)}
                      className="rounded-circle object-fit-cover flex-shrink-0"
                      width="54"
                      height="54"
                      alt={user?.name || "user"}
                    />

                    <div className="flex-grow-1 overflow-hidden">
                      <div className="fw-bold text-gray-900 text-truncate">
                        {user?.name || "User"}
                      </div>

                      <small className="text-gray-500 d-block text-truncate">
                        {user?.about || "Hey there! I am using ChatterBox 😂"}
                      </small>
                    </div>
                  </div>

                  <div className="d-none d-sm-flex align-items-center gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => goToChat(user?._id)}
                      className="h-10 w-10 rounded-full border-0 text-white d-flex align-items-center justify-content-center shadow-sm"
                      style={{
                        background: "linear-gradient(135deg, #ff9f43, #ff5c2a)",
                      }}
                      title="Chat"
                    >
                      <FaComments size={15} />
                    </button>

                    <button
                      type="button"
                      onClick={() => startCall(user?._id, "audio")}
                      className="h-10 w-10 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 border-0 d-flex align-items-center justify-content-center"
                      title="Audio Call"
                    >
                      <FaMicrophone size={14} />
                    </button>

                    <button
                      type="button"
                      onClick={() => startCall(user?._id, "video")}
                      className="h-10 w-10 rounded-full bg-orange-50 hover:bg-orange-100 text-orange-500 border-0 d-flex align-items-center justify-content-center"
                      title="Video Call"
                    >
                      <FaVideo size={14} />
                    </button>
                  </div>

                  <div className="d-sm-none flex-shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(openMenuId === user?._id ? null : user?._id);
                      }}
                      className="h-10 w-10 rounded-full bg-gray-100 text-gray-600 border-0 d-flex align-items-center justify-content-center"
                    >
                      <FaEllipsisV size={14} />
                    </button>

                    {openMenuId === user?._id && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="position-absolute end-0 top-100 mt-2 me-3 bg-white rounded-3 shadow-lg border border-gray-100 overflow-hidden z-[10000]"
                        style={{ minWidth: 150 }}
                      >
                        <button
                          type="button"
                          onClick={() => goToChat(user?._id)}
                          className="w-100 border-0 bg-white px-3 py-2 d-flex align-items-center gap-2 text-gray-700"
                        >
                          <FaComments className="text-orange-500" />
                          Chat
                        </button>

                        <button
                          type="button"
                          onClick={() => startCall(user?._id, "audio")}
                          className="w-100 border-0 bg-white px-3 py-2 d-flex align-items-center gap-2 text-gray-700"
                        >
                          <FaMicrophone />
                          Audio
                        </button>

                        <button
                          type="button"
                          onClick={() => startCall(user?._id, "video")}
                          className="w-100 border-0 bg-white px-3 py-2 d-flex align-items-center gap-2 text-gray-700"
                        >
                          <FaVideo className="text-orange-500" />
                          Video
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-5 text-gray-400">
              <FaUserFriends size={42} className="mx-auto mb-3 opacity-50" />
              <h6 className="text-gray-700 fw-bold">No users found</h6>
              <p className="mb-0 small">Try another search keyword.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function NetworkSkeleton() {
  return (
    <div className="d-flex flex-column gap-3">
      {[1, 2, 3, 4, 5].map((item) => (
        <div
          key={item}
          className="d-flex align-items-center gap-3 rounded-[22px] bg-white p-3 shadow-sm border border-gray-100"
        >
          <div
            className="rounded-circle bg-gray-200 flex-shrink-0"
            style={{ width: 54, height: 54 }}
          />

          <div className="flex-grow-1">
            <div
              className="bg-gray-200 rounded-pill mb-2"
              style={{ width: "45%", height: 12 }}
            />
            <div
              className="bg-gray-100 rounded-pill"
              style={{ width: "70%", height: 10 }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}