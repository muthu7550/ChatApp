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

      const res = await fetch(
        `/api/users?userId=${currentUser?._id}&search=${searchText}`
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
      )}&background=00a884&color=fff`
    );
  }

  return (
    <div className="position-fixed top-0 start-0 w-100 h-100 bg-black bg-opacity-75 d-flex align-items-end align-items-sm-center justify-content-center z-3 px-0 px-sm-3">
      <div
        className="bg-dark text-white shadow-lg w-100 overflow-hidden network-modal-card"
        style={{
          maxWidth: "560px",
          maxHeight: "92vh",
          borderRadius: "24px 24px 0 0",
        }}
      >
        <style>{`
          @media (min-width: 576px) {
            .network-modal-card {
              border-radius: 24px !important;
            }
          }

          .network-scroll::-webkit-scrollbar {
            width: 6px;
          }

          .network-scroll::-webkit-scrollbar-thumb {
            background: #2a3942;
            border-radius: 999px;
          }

          .network-user-row {
            background: #111b21;
            transition: 0.2s ease;
          }

          .network-user-row:hover {
            background: #202c33;
          }
        `}</style>

        <header className="d-flex align-items-center justify-content-between px-4 py-3 border-bottom border-secondary">
          <div className="d-flex align-items-center gap-3 min-w-0">
            <div
              className="rounded-circle bg-success bg-opacity-25 d-flex align-items-center justify-content-center text-success flex-shrink-0"
              style={{ width: 44, height: 44 }}
            >
              <FaUserFriends />
            </div>

            <div className="min-w-0">
              <h5 className="mb-0 fw-bold text-truncate">Our Network</h5>
              <small className="text-secondary">
                Search users and connect
              </small>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn btn-sm btn-outline-light rounded-circle flex-shrink-0"
            style={{ width: 36, height: 36 }}
          >
            <FaTimes />
          </button>
        </header>

        <div className="p-3 p-sm-4 border-bottom border-secondary">
          <div className="position-relative">
            <FaSearch className="position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary" />

            <input
              value={search}
              onChange={(e) => {
                const value = e.target.value;
                setSearch(value);
                fetchUsers(value);
              }}
              placeholder="Search user by name..."
              className="form-control bg-black bg-opacity-50 text-white border-secondary rounded-4 ps-5 py-3"
            />
          </div>
        </div>

        <div
          className="network-scroll overflow-auto p-3 p-sm-4"
          style={{ maxHeight: "calc(92vh - 150px)" }}
        >
          {loading ? (
            <NetworkSkeleton />
          ) : users.length > 0 ? (
            users.map((user) => (
              <div
                key={user?._id}
                className="network-user-row d-flex align-items-center gap-3 rounded-4 p-3 mb-2"
              >
                <img
                  src={getAvatar(user)}
                  className="rounded-circle object-fit-cover flex-shrink-0"
                  width="50"
                  height="50"
                  alt={user?.name || "user"}
                />

                <div className="flex-grow-1 overflow-hidden">
                  <div className="fw-bold text-truncate">
                    {user?.name || "User"}
                  </div>

                  <small className="text-secondary d-block text-truncate">
                    {user?.about || "Hey there! I am using ChatterBox 😂"}
                  </small>
                </div>

                <div className="d-flex align-items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => onStartChat(user?._id)}
                    className="btn btn-success rounded-circle d-flex align-items-center justify-content-center"
                    style={{ width: 38, height: 38 }}
                    title="Chat"
                  >
                    <FaComments size={15} />
                  </button>

                  <button
                    type="button"
                    onClick={() => onStartCall(user?._id, "audio")}
                    className="btn btn-outline-light rounded-circle d-flex align-items-center justify-content-center"
                    style={{ width: 38, height: 38 }}
                    title="Audio Call"
                  >
                    <FaMicrophone size={14} />
                  </button>

                  <button
                    type="button"
                    onClick={() => onStartCall(user?._id, "video")}
                    className="btn btn-outline-success rounded-circle d-flex align-items-center justify-content-center"
                    style={{ width: 38, height: 38 }}
                    title="Video Call"
                  >
                    <FaVideo size={14} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-5 text-secondary">
              <FaUserFriends size={42} className="mb-3 opacity-50" />
              <h6 className="text-white">No users found</h6>
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
    <>
      {[1, 2, 3, 4, 5].map((item) => (
        <div
          key={item}
          className="d-flex align-items-center gap-3 rounded-4 p-3 mb-2"
          style={{ background: "#111b21" }}
        >
          <div
            className="rounded-circle bg-secondary opacity-25"
            style={{ width: 50, height: 50 }}
          />

          <div className="flex-grow-1">
            <div
              className="bg-secondary opacity-25 rounded-pill mb-2"
              style={{ width: "55%", height: 12 }}
            />
            <div
              className="bg-secondary opacity-25 rounded-pill"
              style={{ width: "80%", height: 10 }}
            />
          </div>
        </div>
      ))}
    </>
  );
}