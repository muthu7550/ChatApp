"use client";

import { useEffect, useState } from "react";
import {
  FaComments,
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

  useEffect(() => {
    fetchUsers("");
  }, []);

  async function fetchUsers(searchText = "") {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      const res = await fetch(
        `/api/users?userId=${currentUser?._id}&search=${searchText}`,
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

  function getAvatar(user) {
    return (
      user?.avatar ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(
        user?.name || "User"
      )}&background=ff6b2c&color=fff`
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/35 backdrop-blur-sm px-4">
      <div className="w-full max-w-[720px] max-h-[90vh] overflow-hidden rounded-[28px] bg-white shadow-2xl border border-gray-100 d-flex flex-column">
        <header className="d-flex align-items-center justify-content-between px-4 px-sm-5 py-4 border-bottom bg-white">
          <div className="d-flex align-items-center gap-3 min-w-0">
            <div className="h-12 w-12 rounded-2xl bg-orange-50 text-orange-500 d-flex align-items-center justify-content-center">
              <FaUserFriends size={20} />
            </div>

            <div className="min-w-0">
              <h4 className="mb-0 fw-bold text-gray-900 text-truncate">
                Our Network
              </h4>
              <small className="text-gray-500">
                Search users and connect instantly
              </small>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="h-10 w-10 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 d-flex align-items-center justify-content-center border-0 transition"
          >
            <FaTimes />
          </button>
        </header>

        <div className="px-4 px-sm-5 py-4 bg-[#fafafa] border-bottom">
          <div className="position-relative">
            <FaSearch className="position-absolute top-50 start-0 translate-middle-y ms-4 text-gray-400" />

            <input
              value={search}
              onChange={(e) => {
                const value = e.target.value;
                setSearch(value);
                fetchUsers(value);
              }}
              placeholder="Search user by name..."
              className="form-control border-0 bg-white rounded-pill ps-5 py-3 text-gray-800 shadow-sm"
            />
          </div>
        </div>

        <div className="overflow-auto p-4 p-sm-5 bg-[#fafafa] flex-grow-1">
          {loading ? (
            <NetworkSkeleton />
          ) : users.length > 0 ? (
            <div className="d-flex flex-column gap-3">
              {users.map((user) => (
                <div
                  key={user?._id}
                  className="d-flex align-items-center gap-3 rounded-[22px] bg-white p-3 shadow-sm border border-gray-100 hover:bg-gray-50 transition"
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

                  <div className="d-flex align-items-center gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => onStartChat(user?._id)}
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
                      onClick={() => onStartCall(user?._id, "audio")}
                      className="h-10 w-10 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 border-0 d-flex align-items-center justify-content-center"
                      title="Audio Call"
                    >
                      <FaMicrophone size={14} />
                    </button>

                    <button
                      type="button"
                      onClick={() => onStartCall(user?._id, "video")}
                      className="h-10 w-10 rounded-full bg-orange-50 hover:bg-orange-100 text-orange-500 border-0 d-flex align-items-center justify-content-center"
                      title="Video Call"
                    >
                      <FaVideo size={14} />
                    </button>
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
            className="rounded-circle bg-gray-200"
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