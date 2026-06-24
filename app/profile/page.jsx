"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Cropper from "react-easy-crop";
import "bootstrap/dist/css/bootstrap.min.css";

export default function ProfilePage() {
  const router = useRouter();

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ name: "", about: "", avatar: "" });
  const [uploading, setUploading] = useState(false);
  const [showPhotoMenu, setShowPhotoMenu] = useState(false);

  const [imageSrc, setImageSrc] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "null");

    if (!storedUser?._id) {
      router.push("/auth/login");
      return;
    }

    setUser(storedUser);

    setForm({
      name: storedUser?.name || "",
      about: storedUser?.about || "Hey there! I am using ChatterBox 😂",
      avatar: storedUser?.avatar || "",
    });
  }, [router]);

  function handleRemovePhoto() {
    setForm((prev) => ({ ...prev, avatar: "" }));
    setShowPhotoMenu(false);
  }

  function handleSelectImage(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      setImageSrc(reader.result);
      setShowCropper(true);
      setShowPhotoMenu(false);
      e.target.value = "";
    };

    reader.readAsDataURL(file);
  }

  function onCropComplete(_, croppedPixels) {
    setCroppedAreaPixels(croppedPixels);
  }

  async function createCroppedImage() {
    if (!imageSrc || !croppedAreaPixels) return;

    setUploading(true);

    try {
      const blob = await getCroppedBlob(imageSrc, croppedAreaPixels);
      const file = new File([blob], "profile.jpg", { type: "image/jpeg" });

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

      const result = await res.json();

      if (!res.ok || !result?.url) {
        alert(result?.error || "Image upload failed");
        return;
      }

      setForm((prev) => ({ ...prev, avatar: result.url }));
      setShowCropper(false);
      setImageSrc(null);
    } catch (error) {
      console.error("Crop upload error:", error);
      alert("Image upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.name.trim()) {
      alert("Name is required");
      return;
    }

    const token = localStorage.getItem("token");

    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: JSON.stringify({
        userId: user?._id,
        name: form.name,
        about: form.about,
        avatar: form.avatar,
      }),
    });

    const result = await res.json();

    if (!result?.success) {
      alert(result?.error || "Profile update failed");
      return;
    }

    localStorage.setItem("user", JSON.stringify(result.user));
    router.push("/chat");
  }

  return (
    <main className="min-vh-100 d-flex align-items-center justify-content-center px-3 py-4 bg-[linear-gradient(135deg,#ff9d2e,#ff5b2f)]">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-sm-10 col-md-7 col-lg-5">
            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-4 shadow-lg p-4 p-sm-5"
            >
              <div className="text-center mb-4">
                <h1 className="fw-black text-dark mb-2 fs-2">
                  Setup Profile
                </h1>
                <p className="text-secondary mb-0 small">
                  Add your photo and details to continue.
                </p>
              </div>

              <div className="d-flex justify-content-center mb-4">
                <button
                  type="button"
                  onClick={() => setShowPhotoMenu(true)}
                  className="border-0 bg-transparent p-0 position-relative"
                >
                  <img
                    src={
                      form.avatar ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        form.name || "User"
                      )}&background=ff5b2f&color=fff`
                    }
                    alt="profile"
                    className="rounded-circle object-fit-cover shadow"
                    style={{
                      width: "132px",
                      height: "132px",
                      border: "5px solid #fff3ec",
                    }}
                  />

                  <span
                    className="position-absolute bottom-0 end-0 d-flex align-items-center justify-content-center rounded-circle bg-warning text-white shadow"
                    style={{
                      width: "42px",
                      height: "42px",
                      border: "4px solid white",
                    }}
                  >
                    📷
                  </span>
                </button>
              </div>

              <div className="mb-3">
                <label className="form-label fw-bold small text-dark">
                  Full Name
                </label>
                <input
                  className="form-control form-control-lg rounded-3 border-warning-subtle bg-warning-subtle bg-opacity-25"
                  placeholder="Enter your name"
                  value={form.name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      name: e.target.value,
                    })
                  }
                />
              </div>

              <div className="mb-4">
                <label className="form-label fw-bold small text-dark">
                  About
                </label>
                <textarea
                  className="form-control rounded-3 border-warning-subtle bg-warning-subtle bg-opacity-25"
                  placeholder="Tell something about yourself..."
                  value={form.about}
                  rows={4}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      about: e.target.value,
                    })
                  }
                />
              </div>

              <button
                type="submit"
                disabled={uploading}
                className="btn w-100 rounded-3 py-3 fw-bold text-white border-0"
                style={{
                  background: "linear-gradient(135deg,#ff9d2e,#ff5b2f)",
                }}
              >
                {uploading ? "Uploading..." : "Continue to Chat"}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                hidden
                accept="image/*"
                onChange={handleSelectImage}
              />

              <input
                ref={cameraInputRef}
                type="file"
                hidden
                accept="image/*"
                capture="user"
                onChange={handleSelectImage}
              />
            </form>
          </div>
        </div>
      </div>

      {showPhotoMenu && (
        <div className="position-fixed top-0 start-0 w-100 h-100 bg-black bg-opacity-50 d-flex align-items-end align-items-sm-center justify-content-center p-3 z-3">
          <div
            className="bg-white rounded-4 shadow-lg w-100 p-4"
            style={{ maxWidth: "420px" }}
          >
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h5 className="fw-black mb-0 text-dark">Profile Photo</h5>

              <button
                type="button"
                onClick={() => setShowPhotoMenu(false)}
                className="btn-close"
              />
            </div>

            <div className="d-grid gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn btn-light border rounded-3 p-3 text-start fw-bold d-flex align-items-center gap-3"
              >
                <span className="fs-4 flex-shrink-0">🖼️</span>
                <span className="text-nowrap">Choose from Gallery</span>
              </button>

              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="btn btn-light border rounded-3 p-3 text-start fw-bold d-flex align-items-center gap-3"
              >
                <span className="fs-4 flex-shrink-0">📷</span>
                <span className="text-nowrap">Open Camera</span>
              </button>

              <button
                type="button"
                onClick={handleRemovePhoto}
                disabled={!form.avatar}
                className="btn btn-light border rounded-3 p-3 text-start fw-bold d-flex align-items-center gap-3 text-danger"
              >
                <span className="fs-4 flex-shrink-0">🗑️</span>
                <span className="text-nowrap">Remove Photo</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {showCropper && (
        <div className="position-fixed top-0 start-0 w-100 h-100 bg-black d-flex flex-column z-3">
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

          <div className="bg-white p-3 p-sm-4">
            <label className="form-label fw-bold text-dark">Zoom</label>

            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="form-range"
            />

            <div className="row g-3 mt-2">
              <div className="col-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowCropper(false);
                    setImageSrc(null);
                  }}
                  className="btn btn-light border w-100 rounded-3 py-3 fw-bold"
                >
                  Cancel
                </button>
              </div>

              <div className="col-6">
                <button
                  type="button"
                  onClick={createCroppedImage}
                  disabled={uploading}
                  className="btn w-100 rounded-3 py-3 fw-bold text-white border-0"
                  style={{
                    background:
                      "linear-gradient(135deg,#ff9d2e,#ff5b2f)",
                  }}
                >
                  {uploading ? "Uploading..." : "Upload"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
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
          if (!blob) reject(new Error("Canvas is empty"));
          else resolve(blob);
        },
        "image/jpeg",
        0.9
      );
    };

    image.onerror = reject;
  });
}