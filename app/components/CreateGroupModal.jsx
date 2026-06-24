"use client";

import { useMemo, useRef, useState } from "react";
import {
  FaCheck,
  FaPlus,
  FaSearch,
  FaTimes,
  FaUsers,
  FaUserPlus,
} from "react-icons/fa";
import Cropper from "react-easy-crop";

export default function CreateGroupModal({
  currentUser,
  users = [],
  conversations = [],
  onClose,
  onCreated,
}) {
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [networkSearch, setNetworkSearch] = useState("");
  const [showNetworkModal, setShowNetworkModal] = useState(false);
  const [errors, setErrors] = useState({});
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef(null);

  const [imageSrc, setImageSrc] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const personalChatUsers = useMemo(() => {
    const directChats = conversations.filter((item) => item?.type === "direct");

    const people = directChats
      .map((chat) =>
        chat?.members?.find((member) => member?._id !== currentUser?._id)
      )
      .filter(Boolean);

    const unique = new Map();

    people.forEach((person) => {
      unique.set(person?._id, person);
    });

    return Array.from(unique.values());
  }, [conversations, currentUser?._id]);

  const personalUsersToShow = useMemo(() => {
    const value = search.toLowerCase().trim();

    if (!value) return personalChatUsers;

    return personalChatUsers.filter((user) =>
      user?.name?.toLowerCase().includes(value)
    );
  }, [personalChatUsers, search]);

  const networkUsersToShow = useMemo(() => {
    const value = networkSearch.toLowerCase().trim();

    const alreadyPersonalIds = new Set(personalChatUsers.map((user) => user?._id));

    const networkOnly = users.filter(
      (user) => user?._id && user?._id !== currentUser?._id && !alreadyPersonalIds.has(user?._id)
    );

    if (!value) return networkOnly;

    return networkOnly.filter((user) =>
      user?.name?.toLowerCase().includes(value)
    );
  }, [users, currentUser?._id, personalChatUsers, networkSearch]);

  const selectedMembers = users.filter((user) =>
    selectedUsers.includes(user?._id)
  );

  function getAvatar(user) {
    return (
      user?.avatar ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(
        user?.name || "User"
      )}&background=ff6b2c&color=fff&bold=true`
    );
  }

  function getGroupAvatar() {
    return (
      avatar ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(
        name || "Group"
      )}&background=ff6b2c&color=fff&bold=true`
    );
  }

  function toggleUser(userId) {
    if (!userId) return;

    setErrors((prev) => ({
      ...prev,
      members: "",
    }));

    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
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
        setErrors({
          submit: result?.error || "Image upload failed",
        });
        return;
      }

      setAvatar(result?.url);
      setShowCropper(false);
      setImageSrc(null);
    } catch (error) {
      console.error(error);
      setErrors({
        submit: "Image upload failed",
      });
    } finally {
      setUploading(false);
    }
  }

  async function createGroup() {
    const nextErrors = {};

    if (!name.trim()) {
      nextErrors.name = "Group name is required";
    }

    if (selectedUsers.length === 0) {
      nextErrors.members = "Select at least one member";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    try {
      setCreating(true);

      const token = localStorage.getItem("token");

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
          currentUserId: currentUser?._id,
          members: [currentUser?._id, ...selectedUsers],
        }),
      });

      const result = await res.json().catch(() => null);

      if (!res.ok || !result?.success) {
        setErrors({
          submit: result?.error || "Group create failed",
        });
        return;
      }

      onCreated?.(result?.conversation);
    } catch (error) {
      console.error(error);
      setErrors({
        submit: "Group create failed",
      });
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="group-backdrop">
      <style>{`
        .group-backdrop {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: rgba(0,0,0,.48);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: flex-end;
          justify-content: center;
        }

        @media (min-width: 768px) {
          .group-backdrop {
            align-items: center;
            padding: 20px;
          }
        }

        .group-modal {
          width: 100%;
          max-width: 960px;
          height: 94dvh;
          background: white;
          border-radius: 28px 28px 0 0;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 30px 100px rgba(0,0,0,.35);
        }

        @media (min-width: 768px) {
          .group-modal {
            height: auto;
            max-height: 88dvh;
            border-radius: 32px;
          }
        }

        .group-head {
          background: linear-gradient(135deg,#ff9d2e,#ff5b2f);
          color: white;
          padding: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .group-head-icon {
          width: 48px;
          height: 48px;
          border-radius: 18px;
          background: rgba(255,255,255,.2);
          display: grid;
          place-items: center;
          flex-shrink: 0;
        }

        .group-close {
          width: 42px;
          height: 42px;
          border: 0;
          border-radius: 999px;
          background: rgba(255,255,255,.18);
          color: white;
        }

        .group-body {
          flex: 1;
          overflow: auto;
          background: #fff7f1;
          padding: 14px;
        }

        @media (min-width: 768px) {
          .group-body {
            padding: 22px;
          }
        }

        .group-grid {
          display: grid;
          gap: 14px;
        }

        @media (min-width: 768px) {
          .group-grid {
            grid-template-columns: 340px 1fr;
          }
        }

        .panel {
          background: white;
          border: 1px solid #ffe0cf;
          border-radius: 24px;
          padding: 18px;
          box-shadow: 0 12px 35px rgba(255,91,47,.08);
        }

        .group-photo-wrap {
          position: relative;
          display: inline-block;
        }

        .group-photo {
          width: 104px;
          height: 104px;
          border-radius: 999px;
          object-fit: cover;
          border: 6px solid #fff3eb;
        }

        .photo-plus {
          position: absolute;
          right: 2px;
          bottom: 2px;
          width: 38px;
          height: 38px;
          border-radius: 999px;
          border: 4px solid white;
          background: linear-gradient(135deg,#ff9d2e,#ff5b2f);
          color: white;
          display: grid;
          place-items: center;
          cursor: pointer;
        }

        .input-clean {
          width: 100%;
          border: 1px solid #ffe0cf;
          background: #fffaf7;
          border-radius: 18px;
          padding: 14px 16px;
          outline: none;
        }

        .input-clean:focus {
          border-color: #ff5b2f;
          background: white;
          box-shadow: 0 0 0 4px rgba(255,91,47,.11);
        }

        .search-wrap {
          position: relative;
        }

        .search-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          pointer-events: none;
        }

        .search-input {
          padding-left: 45px;
        }

        .choose-network-btn {
          width: 100%;
          border: 1px solid #ffd7c2;
          background: #fff7f1;
          color: #ff5b2f;
          border-radius: 18px;
          padding: 13px 16px;
          font-weight: 900;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .selected-row {
          display: flex;
          gap: 12px;
          overflow-x: auto;
          padding-bottom: 10px;
        }

        .selected-pill {
          width: 72px;
          flex: 0 0 auto;
          text-align: center;
          position: relative;
        }

        .selected-pill img {
          width: 54px;
          height: 54px;
          border-radius: 999px;
          object-fit: cover;
          border: 3px solid #fff3eb;
        }

        .remove-pill {
          position: absolute;
          top: -5px;
          right: 5px;
          width: 22px;
          height: 22px;
          border: 0;
          border-radius: 999px;
          background: #ef4444;
          color: white;
        }

        .people-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
          max-height: 330px;
          overflow-y: auto;
          padding-right: 4px;
        }

        @media (min-width: 768px) {
          .people-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        .person-card {
          border: 1px solid #f1f1f1;
          background: white;
          border-radius: 20px;
          padding: 12px;
          display: flex;
          align-items: center;
          gap: 12px;
          text-align: left;
        }

        .person-card.selected {
          border-color: #ff8b55;
          background: #fff1e7;
        }

        .person-card img {
          width: 46px;
          height: 46px;
          border-radius: 999px;
          object-fit: cover;
        }

        .check-circle {
          width: 28px;
          height: 28px;
          border-radius: 999px;
          border: 1px solid #ddd;
          display: grid;
          place-items: center;
          flex-shrink: 0;
        }

        .person-card.selected .check-circle {
          border: 0;
          background: linear-gradient(135deg,#ff9d2e,#ff5b2f);
          color: white;
        }

        .error-box {
          border: 1px solid #fecaca;
          background: #fff1f2;
          color: #dc2626;
          border-radius: 15px;
          padding: 10px 13px;
          font-size: 13px;
          font-weight: 800;
        }

        .group-foot {
          background: white;
          border-top: 1px solid #ffe0cf;
          padding: 14px;
          display: flex;
          gap: 10px;
          flex-direction: column-reverse;
        }

        @media (min-width: 576px) {
          .group-foot {
            flex-direction: row;
            padding: 18px 22px;
          }
        }

        .cancel-btn,
        .create-btn {
          flex: 1;
          border: 0;
          border-radius: 18px;
          padding: 14px;
          font-weight: 900;
        }

        .cancel-btn {
          background: #f4f4f5;
          color: #52525b;
        }

        .create-btn {
          background: linear-gradient(135deg,#ff9d2e,#ff5b2f);
          color: white;
          box-shadow: 0 12px 28px rgba(255,91,47,.25);
        }

        .network-modal {
          position: fixed;
          inset: 0;
          z-index: 10001;
          background: rgba(0,0,0,.55);
          backdrop-filter: blur(7px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }

        .network-card {
          width: 100%;
          max-width: 520px;
          max-height: 84dvh;
          background: white;
          border-radius: 28px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
      `}</style>

      <div className="group-modal">
        <header className="group-head">
          <div className="d-flex align-items-center gap-3 min-w-0">
            <div className="group-head-icon">
              <FaUsers />
            </div>

            <div className="min-w-0">
              <h5 className="mb-0 fw-black text-truncate">Create Group</h5>
              <small className="text-white-50">
                {selectedUsers.length} member selected
              </small>
            </div>
          </div>

          <button type="button" onClick={onClose} className="group-close">
            <FaTimes />
          </button>
        </header>

        <div className="group-body">
          <div className="group-grid">
            <section className="panel">
              <div className="text-center">
                <div className="group-photo-wrap">
                  <img src={getGroupAvatar()} className="group-photo" alt="group" />

                  <label className="photo-plus">
                    <FaPlus size={13} />
                    <input
                      ref={fileInputRef}
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handleSelectImage}
                    />
                  </label>
                </div>

                <h6 className="fw-black text-dark mt-3 mb-1">Group Details</h6>
                <p className="small text-secondary mb-3">
                  Add group name and optional image.
                </p>
              </div>

              <label className="form-label small fw-bold text-secondary">
                Group Name
              </label>

              <input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setErrors((prev) => ({ ...prev, name: "" }));
                }}
                placeholder="Enter group name"
                maxLength={40}
                className="input-clean"
              />

              {errors.name && <div className="error-box mt-2">{errors.name}</div>}

              <small className="d-block text-secondary mt-2">
                {uploading ? "Uploading image..." : "Maximum 40 characters"}
              </small>

              {selectedMembers.length > 0 && (
                <div className="mt-4">
                  <div className="small fw-bold text-secondary mb-2">
                    Selected Members
                  </div>

                  <div className="selected-row">
                    {selectedMembers.map((user) => (
                      <div key={user?._id} className="selected-pill">
                        <img src={getAvatar(user)} alt={user?.name || "User"} />

                        <button
                          type="button"
                          onClick={() => toggleUser(user?._id)}
                          className="remove-pill"
                        >
                          <FaTimes size={9} />
                        </button>

                        <small className="d-block text-truncate text-secondary mt-1">
                          {user?.name || "User"}
                        </small>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            <section className="panel">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div>
                  <h6 className="fw-black text-dark mb-1">Personal Chat List</h6>
                  <small className="text-secondary">
                    Select members from your existing chats.
                  </small>
                </div>

                <div className="group-head-icon text-white" style={{ background: "linear-gradient(135deg,#ff9d2e,#ff5b2f)" }}>
                  <FaUserPlus />
                </div>
              </div>

              {errors.members && (
                <div className="error-box mb-3">{errors.members}</div>
              )}

              {errors.submit && (
                <div className="error-box mb-3">{errors.submit}</div>
              )}

              <div className="search-wrap mb-3">
                <FaSearch className="search-icon" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search personal chats..."
                  className="input-clean search-input"
                />
              </div>

              <button
                type="button"
                onClick={() => setShowNetworkModal(true)}
                className="choose-network-btn mb-3"
              >
                <FaUserPlus />
                Choose from network
              </button>

              <PeopleList
                users={personalUsersToShow}
                selectedUsers={selectedUsers}
                getAvatar={getAvatar}
                toggleUser={toggleUser}
                emptyText="No personal chats found"
              />
            </section>
          </div>
        </div>

        <footer className="group-foot">
          <button
            type="button"
            onClick={onClose}
            disabled={creating}
            className="cancel-btn"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={createGroup}
            disabled={creating || uploading}
            className="create-btn"
          >
            {creating ? "Creating..." : "Create Group"}
          </button>
        </footer>
      </div>

      {showNetworkModal && (
        <div className="network-modal">
          <div className="network-card">
            <header className="group-head">
              <div>
                <h5 className="mb-0 fw-black">Choose From Network</h5>
                <small className="text-white-50">
                  Add people outside your personal chats.
                </small>
              </div>

              <button
                type="button"
                onClick={() => setShowNetworkModal(false)}
                className="group-close"
              >
                <FaTimes />
              </button>
            </header>

            <div className="p-3 flex-grow-1 overflow-auto">
              <div className="search-wrap mb-3">
                <FaSearch className="search-icon" />
                <input
                  value={networkSearch}
                  onChange={(e) => setNetworkSearch(e.target.value)}
                  placeholder="Search network people..."
                  className="input-clean search-input"
                />
              </div>

              <PeopleList
                users={networkUsersToShow}
                selectedUsers={selectedUsers}
                getAvatar={getAvatar}
                toggleUser={toggleUser}
                emptyText="No network users found"
              />
            </div>

            <footer className="group-foot">
              <button
                type="button"
                onClick={() => setShowNetworkModal(false)}
                className="create-btn"
              >
                Done
              </button>
            </footer>
          </div>
        </div>
      )}

      {showCropper && (
        <div className="position-fixed top-0 start-0 w-100 h-100 bg-black d-flex flex-column" style={{ zIndex: 10002 }}>
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

          <div className="bg-white p-3">
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
                className="cancel-btn"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={uploadCroppedImage}
                disabled={uploading}
                className="create-btn"
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

function PeopleList({
  users,
  selectedUsers,
  getAvatar,
  toggleUser,
  emptyText,
}) {
  return (
    <div className="people-grid">
      {users.length > 0 ? (
        users.map((user) => {
          const selected = selectedUsers.includes(user?._id);

          return (
            <button
              key={user?._id}
              type="button"
              onClick={() => toggleUser(user?._id)}
              className={`person-card ${selected ? "selected" : ""}`}
            >
              <img src={getAvatar(user)} alt={user?.name || "User"} />

              <div className="flex-grow-1 overflow-hidden">
                <div className="fw-bold text-dark text-truncate">
                  {user?.name || "User"}
                </div>

                <small className="text-secondary d-block text-truncate">
                  {user?.about || "Hey there! I am using ChatterBox"}
                </small>
              </div>

              <span className="check-circle">
                {selected && <FaCheck size={12} />}
              </span>
            </button>
          );
        })
      ) : (
        <div className="text-center py-5 text-secondary">
          <FaUsers size={34} className="mb-3 opacity-50" />
          <p className="mb-0">{emptyText}</p>
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
          if (!blob) reject(new Error("Canvas empty"));
          else resolve(blob);
        },
        "image/jpeg",
        0.9
      );
    };

    image.onerror = reject;
  });
}