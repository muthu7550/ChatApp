"use client";

import { useMemo, useRef, useState } from "react";
import {
  FaCamera,
  FaCheck,
  FaSearch,
  FaTimes,
  FaUsers,
  FaUserPlus,
} from "react-icons/fa";
import Cropper from "react-easy-crop";

export default function CreateGroupModal({
  currentUser,
  users = [],
  onClose,
  onCreated,
}) {
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [uploading, setUploading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [search, setSearch] = useState("");

  const fileInputRef = useRef(null);

  const [imageSrc, setImageSrc] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const filteredUsers = useMemo(() => {
    const value = search.toLowerCase().trim();
    return users.filter((user) => user?.name?.toLowerCase().includes(value));
  }, [users, search]);

  function toggleUser(userId) {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  }

  function getAvatar(user) {
    return (
      user?.avatar ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(
        user?.name || "User"
      )}&background=ff6b2c&color=fff`
    );
  }

  function getGroupAvatar() {
    return (
      avatar ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(
        name || "Group"
      )}&background=ff6b2c&color=fff`
    );
  }

  function handleSelectImage(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      setImageSrc(reader.result);
      setShowCropper(true);
      e.target.value = "";
    };

    reader.readAsDataURL(file);
  }

  function onCropComplete(_, croppedPixels) {
    setCroppedAreaPixels(croppedPixels);
  }

  async function uploadCroppedImage() {
    if (!imageSrc || !croppedAreaPixels) return;

    try {
      setUploading(true);

      const blob = await getCroppedBlob(imageSrc, croppedAreaPixels);
      const file = new File([blob], "group.jpg", { type: "image/jpeg" });

      const formData = new FormData();
      formData.append("file", file);

      const token = localStorage.getItem("token");

      const res = await fetch("/api/upload", {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: formData,
      });

      const result = await res.json().catch(() => null);

      if (!res.ok || (!result?.success && !result?.url)) {
        alert(result?.error || "Group image upload failed");
        return;
      }

      setAvatar(result?.url);
      setShowCropper(false);
      setImageSrc(null);
    } catch (error) {
      console.error("GROUP IMAGE UPLOAD ERROR:", error);
      alert("Group image upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function createGroup() {
    if (!name.trim()) return alert("Group name required");
    if (!currentUser?._id) return alert("Login again");
    if (selectedUsers.length === 0) return alert("Select at least one user");

    try {
      setCreating(true);

      const token = localStorage.getItem("token");
      const members = [currentUser._id, ...selectedUsers];

      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          type: "group",
          name: name.trim(),
          avatar: getGroupAvatar(),
          currentUserId: currentUser._id,
          members,
        }),
      });

      const result = await res.json().catch(() => null);

      if (!res.ok || !result?.success) {
        alert(result?.error || "Group create failed");
        return;
      }

      onCreated?.(result?.conversation);
    } catch (error) {
      console.error("GROUP CREATE ERROR:", error);
      alert("Group create failed");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/35 backdrop-blur-sm px-4">
      <div className="w-full max-w-[760px] max-h-[90vh] overflow-hidden rounded-[28px] bg-white shadow-2xl border border-gray-100 d-flex flex-column">
        <header className="d-flex align-items-center justify-content-between px-4 px-sm-5 py-4 border-bottom bg-white">
          <div className="d-flex align-items-center gap-3 min-w-0">
            <div className="h-12 w-12 rounded-2xl bg-orange-50 text-orange-500 d-flex align-items-center justify-content-center">
              <FaUsers size={20} />
            </div>

            <div className="min-w-0">
              <h4 className="mb-0 fw-bold text-gray-900 text-truncate">
                Create Group
              </h4>
              <small className="text-gray-500">
                {selectedUsers.length} member selected
              </small>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="h-10 w-10 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 d-flex align-items-center justify-content-center border-0"
          >
            <FaTimes />
          </button>
        </header>

        <div className="overflow-auto p-4 p-sm-5 bg-[#fafafa] flex-grow-1">
          <div className="bg-white rounded-[22px] p-4 shadow-sm border border-gray-100 mb-4">
            <div className="d-flex align-items-center gap-4">
              <div className="position-relative flex-shrink-0">
                <img
                  src={getGroupAvatar()}
                  className="rounded-circle object-fit-cover shadow-sm"
                  width="74"
                  height="74"
                  alt="group"
                />

                <label className="position-absolute bottom-0 end-0 h-8 w-8 rounded-full bg-orange-500 text-white d-flex align-items-center justify-content-center shadow cursor-pointer">
                  <FaCamera size={12} />
                  <input
                    ref={fileInputRef}
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleSelectImage}
                  />
                </label>
              </div>

              <div className="flex-grow-1 min-w-0">
                <label className="form-label small fw-semibold text-gray-600 mb-2">
                  Group name
                </label>

                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter group name"
                  maxLength={40}
                  className="form-control border-0 bg-gray-100 rounded-pill px-4 py-3 text-gray-800 shadow-none"
                />

                <small className="text-gray-400 d-block mt-2">
                  {uploading ? "Uploading image..." : "Add a clear name and photo"}
                </small>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[22px] p-4 shadow-sm border border-gray-100">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div>
                <h6 className="mb-0 fw-bold text-gray-900">Add Members</h6>
                <small className="text-gray-500">
                  Choose users for this group
                </small>
              </div>

              <div className="h-9 w-9 rounded-full bg-orange-50 text-orange-500 d-flex align-items-center justify-content-center">
                <FaUserPlus size={14} />
              </div>
            </div>

            <div className="position-relative mb-4">
              <FaSearch className="position-absolute top-50 start-0 translate-middle-y ms-4 text-gray-400" />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search users..."
                className="form-control border-0 bg-gray-100 rounded-pill ps-5 py-3 text-gray-800 shadow-none"
              />
            </div>

            {selectedUsers.length > 0 && (
              <div className="d-flex gap-3 overflow-auto pb-4 mb-3">
                {selectedUsers.map((id) => {
                  const user = users.find((item) => item?._id === id);

                  return (
                    <div
                      key={id}
                      className="position-relative text-center flex-shrink-0"
                      style={{ width: 68 }}
                    >
                      <img
                        src={getAvatar(user)}
                        className="rounded-circle object-fit-cover shadow-sm"
                        width="50"
                        height="50"
                        alt={user?.name || "user"}
                      />

                      <button
                        type="button"
                        onClick={() => toggleUser(id)}
                        className="position-absolute top-0 end-0 h-5 w-5 rounded-full bg-red-500 text-white d-flex align-items-center justify-content-center border-0"
                      >
                        <FaTimes size={9} />
                      </button>

                      <small className="d-block text-truncate text-gray-500 mt-2">
                        {user?.name || "User"}
                      </small>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="d-flex flex-column gap-2 max-h-[300px] overflow-auto pe-1">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => {
                  const selected = selectedUsers.includes(user?._id);

                  return (
                    <button
                      key={user?._id}
                      type="button"
                      onClick={() => toggleUser(user?._id)}
                      className={`w-100 border-0 text-start d-flex align-items-center gap-3 rounded-[20px] p-3 transition ${
                        selected
                          ? "bg-orange-50"
                          : "bg-gray-50 hover:bg-gray-100"
                      }`}
                    >
                      <img
                        src={getAvatar(user)}
                        className="rounded-circle object-fit-cover flex-shrink-0"
                        width="50"
                        height="50"
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

                      <span
                        className={`h-7 w-7 rounded-full d-flex align-items-center justify-content-center flex-shrink-0 ${
                          selected
                            ? "bg-orange-500 text-white"
                            : "border border-gray-300 bg-white"
                        }`}
                      >
                        {selected && <FaCheck size={12} />}
                      </span>
                    </button>
                  );
                })
              ) : (
                <div className="text-center py-5 text-gray-400">
                  <FaUsers size={36} className="mx-auto mb-3 opacity-50" />
                  <p className="mb-0">No users found</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <footer className="bg-white px-4 px-sm-5 py-4 border-top d-flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={creating}
            className="btn rounded-pill flex-fill py-3 fw-semibold bg-gray-100 text-gray-700 border-0"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={createGroup}
            disabled={creating || uploading}
            className="btn rounded-pill flex-fill py-3 fw-bold text-white border-0 shadow-sm"
            style={{
              background: "linear-gradient(135deg, #ff9f43, #ff5c2a)",
            }}
          >
            {creating ? "Creating..." : "Create Group"}
          </button>
        </footer>
      </div>

      {showCropper && (
        <div className="fixed inset-0 z-[10000] bg-black/95 d-flex flex-column">
          <div className="position-relative flex-grow-1">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>

          <div className="bg-white p-4">
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="form-range"
            />

            <div className="d-flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowCropper(false);
                  setImageSrc(null);
                }}
                className="btn bg-gray-100 rounded-pill flex-fill py-3 fw-semibold"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={uploadCroppedImage}
                className="btn rounded-pill flex-fill py-3 fw-bold text-white border-0"
                style={{
                  background: "linear-gradient(135deg, #ff9f43, #ff5c2a)",
                }}
              >
                {uploading ? "Uploading..." : "Crop & Upload"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getCroppedBlob(imageSrc, crop) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.src = imageSrc;

    image.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      canvas.width = crop.width;
      canvas.height = crop.height;

      ctx.drawImage(
        image,
        crop.x,
        crop.y,
        crop.width,
        crop.height,
        0,
        0,
        crop.width,
        crop.height
      );

      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error("Canvas empty"));
          resolve(blob);
        },
        "image/jpeg",
        0.9
      );
    };

    image.onerror = reject;
  });
}