"use client";

import { useMemo, useState, useRef } from "react";
import { FaCamera, FaCheck, FaSearch, FaTimes, FaUsers } from "react-icons/fa";
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
  setUploading(true);

  const blob = await getCroppedBlob(imageSrc, croppedAreaPixels);
  const file = new File([blob], "group.jpg", { type: "image/jpeg" });

  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  const result = await res.json();

  setAvatar(result?.url);
  setShowCropper(false);
  setImageSrc(null);
  setUploading(false);
}

  const filteredUsers = useMemo(() => {
    const value = search.toLowerCase().trim();

    return users.filter((user) =>
      user?.name?.toLowerCase().includes(value)
    );
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
      )}&background=00a884&color=fff`
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


  function getGroupAvatar() {
    return (
      avatar ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(
        name || "Group"
      )}&background=00a884&color=fff`
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
      e.target.value = "";
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

    try {
      setCreating(true);

      const members = [currentUser._id, ...selectedUsers];

      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
    <div className="position-fixed top-0 start-0 w-100 h-100 bg-black bg-opacity-75 d-flex align-items-end align-items-sm-center justify-content-center z-3 px-0 px-sm-3">
      <div
        className="bg-dark text-white shadow-lg w-100 overflow-hidden"
        style={{
          maxWidth: "520px",
          maxHeight: "92vh",
          borderRadius: "24px 24px 0 0",
        }}
      >
        <style>{`
          @media (min-width: 576px) {
            .group-modal-card {
              border-radius: 24px !important;
            }
          }

          .group-user-row:hover {
            background: #202c33 !important;
          }

          .group-scroll::-webkit-scrollbar {
            width: 6px;
          }

          .group-scroll::-webkit-scrollbar-thumb {
            background: #2a3942;
            border-radius: 999px;
          }
        `}</style>

        <div className="group-modal-card d-flex flex-column h-100">
          <header className="d-flex align-items-center justify-content-between px-4 py-3 border-bottom border-secondary">
            <div className="d-flex align-items-center gap-3">
              <div
                className="rounded-circle bg-success bg-opacity-25 d-flex align-items-center justify-content-center text-success"
                style={{ width: 44, height: 44 }}
              >
                <FaUsers />
              </div>

              <div>
                <h5 className="mb-0 fw-bold">Create Group</h5>
                <small className="text-secondary">
                  {selectedUsers.length} member selected
                </small>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="btn btn-sm btn-outline-light rounded-circle"
              style={{ width: 36, height: 36 }}
            >
              <FaTimes />
            </button>
          </header>

          <div className="p-4 overflow-auto group-scroll">
            <div className="d-flex flex-column align-items-center mb-4">
              <div className="position-relative">
                <img
                  src={getGroupAvatar()}
                  className="rounded-circle object-fit-cover border border-4 border-success"
                  width="104"
                  height="104"
                  alt="group"
                />

            <label
  className="position-absolute bottom-0 end-0 btn btn-success rounded-circle d-flex align-items-center justify-content-center shadow"
  style={{ width: 38, height: 38 }}
>
  <FaCamera size={14} />
  <input
    ref={fileInputRef}
    type="file"
    hidden
    accept="image/*"
    onChange={handleSelectImage}
  />
</label>
              </div>

              <small className="text-secondary mt-2">
                {uploading ? "Uploading image..." : "Tap camera to upload image"}
              </small>
            </div>

            <div className="mb-3">
              <label className="form-label small text-secondary">
                Group name
              </label>

              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter group name"
                className="form-control form-control-lg bg-black bg-opacity-50 text-white border-secondary rounded-4"
                maxLength={40}
              />
            </div>

            <div className="mb-3">
              <label className="form-label small text-secondary">
                Add members
              </label>

              <div className="position-relative">
                <FaSearch className="position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary" />

                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search users..."
                  className="form-control bg-black bg-opacity-50 text-white border-secondary rounded-4 ps-5 py-3"
                />
              </div>
            </div>

            {selectedUsers.length > 0 && (
              <div className="d-flex gap-2 overflow-auto pb-3 mb-2 group-scroll">
                {selectedUsers.map((id) => {
                  const user = users.find((item) => item?._id === id);

                  return (
                    <div
                      key={id}
                      className="text-center flex-shrink-0 position-relative"
                      style={{ width: 64 }}
                    >
                      <img
                        src={getAvatar(user)}
                        className="rounded-circle object-fit-cover"
                        width="48"
                        height="48"
                        alt={user?.name || "user"}
                      />

                      <button
                        type="button"
                        onClick={() => toggleUser(id)}
                        className="btn btn-danger btn-sm rounded-circle position-absolute top-0 end-0 d-flex align-items-center justify-content-center p-0"
                        style={{ width: 18, height: 18 }}
                      >
                        <FaTimes size={9} />
                      </button>

                      <small className="d-block text-truncate text-secondary mt-1">
                        {user?.name || "User"}
                      </small>
                    </div>
                  );
                })}
              </div>
            )}

            <div
              className="group-scroll overflow-auto"
              style={{ maxHeight: "300px" }}
            >
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => {
                  const selected = selectedUsers.includes(user?._id);

                  return (
                    <button
                      key={user?._id}
                      type="button"
                      onClick={() => toggleUser(user?._id)}
                      className="group-user-row btn w-100 border-0 text-start text-white d-flex align-items-center gap-3 rounded-4 p-3 mb-2"
                      style={{ background: selected ? "#123f35" : "#111b21" }}
                    >
                      <img
                        src={getAvatar(user)}
                        className="rounded-circle object-fit-cover flex-shrink-0"
                        width="46"
                        height="46"
                        alt={user?.name}
                      />

                      <div className="flex-grow-1 overflow-hidden">
                        <div className="fw-semibold text-truncate">
                          {user?.name}
                        </div>

                        <small className="text-secondary d-block text-truncate">
                          {user?.about || "Hey there! I am using ChatterBox 😂"}
                        </small>
                      </div>

                      <span
                        className={`rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 ${
                          selected ? "bg-success" : "border border-secondary"
                        }`}
                        style={{ width: 26, height: 26 }}
                      >
                        {selected && <FaCheck size={12} />}
                      </span>
                    </button>
                  );
                })
              ) : (
                <div className="text-center py-5 text-secondary">
                  <FaUsers size={36} className="mb-3 opacity-50" />
                  <p className="mb-0">No users found</p>
                </div>
              )}
            </div>
          </div>

          <footer className="p-3 border-top border-secondary bg-black bg-opacity-25 d-flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={creating}
              className="btn btn-outline-light rounded-4 flex-fill py-3 fw-semibold"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={createGroup}
              disabled={creating || uploading}
              className="btn btn-success rounded-4 flex-fill py-3 fw-bold"
            >
              {creating ? "Creating..." : "Create Group"}
            </button>
          </footer>
        </div>
      </div>

      {showCropper && (
  <div className="position-fixed top-0 start-0 w-100 h-100 bg-black bg-opacity-90 z-3 d-flex flex-column">
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

    <div className="bg-dark p-3">
      <input
        type="range"
        min={1}
        max={3}
        step={0.1}
        value={zoom}
        onChange={(e) => setZoom(Number(e.target.value))}
        className="form-range"
      />

      <div className="d-flex gap-2">
        <button
          type="button"
          onClick={() => {
            setShowCropper(false);
            setImageSrc(null);
          }}
          className="btn btn-outline-light flex-fill"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={uploadCroppedImage}
          className="btn btn-success flex-fill"
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