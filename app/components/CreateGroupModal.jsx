"use client";

import { useState } from "react";

export default function CreateGroupModal({
  currentUser,
  users,
  onClose,
  onCreated,
}) {
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [uploading, setUploading] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);

  function toggleUser(userId) {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  }

  async function handleGroupImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const result = await res.json().catch(() => null);

      console.log("GROUP IMAGE UPLOAD RESULT:", result);

      if (!res.ok || (!result?.success && !result?.url)) {
        alert(result?.error || "Group image upload failed");
        return;
      }

      setAvatar(result?.url);
    } catch (error) {
      console.error("GROUP IMAGE UPLOAD ERROR:", error);
      alert("Group image upload failed");
    } finally {
      setUploading(false);
    }
  }

async function createGroup() {
  if (!name.trim()) {
    alert("Group name required");
    return;
  }

  if (!currentUser?._id) {
    alert("Login again");
    return;
  }

  if (selectedUsers.length === 0) {
    alert("Select at least one user");
    return;
  }

  const members = [currentUser?._id, ...selectedUsers];

  const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name || "Group"
  )}&background=00a884&color=fff`;

  const res = await fetch("/api/conversations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "group",
      name,
      avatar: avatar || defaultAvatar,
      currentUserId: currentUser?._id,
      members,
    }),
  });

  const result = await res.json().catch(() => null);

  if (!res.ok || !result?.success) {
    alert(result?.error || "Group create failed");
    return;
  }

  onCreated(result?.conversation);
}

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
      <div className="w-full max-w-md bg-[#111b21] rounded-3xl p-6 text-white">
        <h2 className="text-2xl font-black mb-4">Create Group</h2>

        <div className="flex flex-col items-center mb-5">
          <img
            src={
              avatar ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                name || "Group"
              )}&background=00a884&color=fff`
            }
            className="w-24 h-24 rounded-full object-cover border-4 border-emerald-500"
            alt="group"
          />

          <label className="mt-3 cursor-pointer bg-emerald-500 text-black px-4 py-2 rounded-xl font-bold">
            {uploading ? "Uploading..." : "Upload Group Image"}
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={handleGroupImageUpload}
            />
          </label>
        </div>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Group name"
          className="w-full bg-[#202c33] p-3 rounded-xl outline-none mb-4"
        />

        <div className="max-h-64 overflow-y-auto space-y-2">
          {users?.map((user) => (
            <label
              key={user?._id}
              className="flex items-center gap-3 bg-[#202c33] p-3 rounded-xl cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedUsers.includes(user?._id)}
                onChange={() => toggleUser(user?._id)}
              />

              <img
                src={
                  user?.avatar ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    user?.name || "User"
                  )}&background=00a884&color=fff`
                }
                className="w-9 h-9 rounded-full object-cover"
                alt={user?.name}
              />

              <span>{user?.name}</span>
            </label>
          ))}
        </div>

        <div className="flex justify-end gap-3 mt-5">
          <button
            onClick={onClose}
            type="button"
            className="px-4 py-2 bg-zinc-700 rounded-xl"
          >
            Cancel
          </button>

          <button
            onClick={createGroup}
            type="button"
            className="px-4 py-2 bg-emerald-500 text-black font-bold rounded-xl"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}