"use client";

import { useEffect, useState } from "react";

export default function NetworkModal({
  currentUser,
  onClose,
  onStartChat,
  onStartCall,
}) {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchUsers("");
  }, []);

  async function fetchUsers(searchText = "") {
    const res = await fetch(
      `/api/users?userId=${currentUser?._id}&search=${searchText}`
    );
    const result = await res.json();
    setUsers(result?.users || []);
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
    <div className="fixed inset-0 z-[9999] bg-black/70 flex items-center justify-center px-4">
      <div className="w-full max-w-lg bg-[#111b21] text-white rounded-3xl overflow-hidden">
        <header className="p-4 bg-[#202c33] flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black">Our Network 🌍</h2>
            <p className="text-xs text-zinc-400">Search users and connect</p>
          </div>

          <button
            onClick={onClose}
            className="bg-red-500 px-3 py-2 rounded-xl font-bold"
          >
            ✕
          </button>
        </header>

        <div className="p-4">
          <input
            value={search}
            onChange={(e) => {
              const value = e.target.value;
              setSearch(value);
              fetchUsers(value);
            }}
            placeholder="Search user by name..."
            className="w-full bg-[#202c33] rounded-xl px-4 py-3 outline-none"
          />
        </div>

        <div className="max-h-[420px] overflow-y-auto">
          {users?.map((user) => (
            <div
              key={user?._id}
              className="flex items-center gap-3 px-4 py-3 hover:bg-[#202c33]"
            >
              <img
                src={getAvatar(user)}
                className="w-12 h-12 rounded-full object-cover"
                alt={user?.name}
              />

              <div className="flex-1 overflow-hidden">
                <h3 className="font-bold truncate">{user?.name}</h3>
                <p className="text-xs text-zinc-400 truncate">
                  {user?.about || "Hey there! I am using ChatterBox 😂"}
                </p>
              </div>

              <button
                onClick={() => onStartChat(user?._id)}
                className="bg-emerald-500 text-black px-3 py-2 rounded-xl font-bold"
                title="Chat"
              >
                💬
              </button>

              <button
                onClick={() => onStartCall(user?._id, "audio")}
                className="bg-[#2a3942] px-3 py-2 rounded-xl"
                title="Audio Call"
              >
                🎙️
              </button>

              <button
                onClick={() => onStartCall(user?._id, "video")}
                className="bg-[#2a3942] px-3 py-2 rounded-xl"
                title="Video Call"
              >
                📹
              </button>
            </div>
          ))}

          {users?.length === 0 && (
            <p className="text-center text-zinc-500 py-8">No users found</p>
          )}
        </div>
      </div>
    </div>
  );
}