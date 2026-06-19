"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Cropper from "react-easy-crop";

export default function ProfilePage() {
  const router = useRouter();

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ name: "", about: "", avatar: "" });

  const [uploading, setUploading] = useState(false);

  const [imageSrc, setImageSrc] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "null");

    if (!storedUser?._id) {
      router.push("/login");
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

  async function createCroppedImage() {
    if (!imageSrc || !croppedAreaPixels) return;

    setUploading(true);

    try {
      const blob = await getCroppedBlob(imageSrc, croppedAreaPixels);

      const file = new File([blob], "profile.jpg", {
        type: "image/jpeg",
      });

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();

      if (!res.ok || !result?.url) {
        alert(result?.error || "Image upload failed");
        return;
      }

      setForm((prev) => ({
        ...prev,
        avatar: result.url,
      }));

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

    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user?._id,
        name: form?.name,
        about: form?.about,
        avatar: form?.avatar,
      }),
    });

    const result = await res.json();

    if (!result?.success) {
      alert(result?.error || "Profile update failed");
      return;
    }

    localStorage.setItem("user", JSON.stringify(result?.user));
    router.push("/chat");
  }

  return (
    <main className="min-h-screen bg-[#0b141a] text-white flex items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-[#111b21] rounded-3xl p-8 space-y-5 shadow-2xl"
      >
        <h1 className="text-3xl font-black text-center">Setup Profile 😂</h1>

        <div className="flex flex-col items-center gap-3">
          <img
            src={
              form?.avatar ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                form?.name || "User"
              )}&background=00a884&color=fff`
            }
            className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-emerald-500"
            alt="profile"
          />

          <div className="flex gap-3 justify-center mt-4 flex-wrap">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="bg-emerald-500 text-black px-5 py-2 rounded-xl font-bold rounded"
            >
              Gallery
            </button>

            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="bg-blue-500 text-white px-5 py-2 rounded-xl font-bold rounded"
            >
              Camera
            </button>

            <button
              type="button"
              onClick={handleRemovePhoto}
              className="bg-red-500 text-white px-5 py-2 rounded-xl font-bold rounded"
            >
              Remove
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
          </div>
        </div>

        <input
          className="w-full bg-[#202c33] p-3 rounded-xl outline-none"
          placeholder="Your name"
          value={form?.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        <textarea
          className="w-full bg-[#202c33] p-3 rounded-xl outline-none min-h-[100px]"
          placeholder="About"
          value={form?.about}
          onChange={(e) => setForm({ ...form, about: e.target.value })}
        />

        <button
          type="submit"
          disabled={uploading}
          className="w-full bg-emerald-500 text-black font-bold p-3 rounded-xl disabled:opacity-60"
        >
          {uploading ? "Uploading..." : "Continue to Chat"}
        </button>
      </form>

      {showCropper && (
        <div className="fixed inset-0 z-[9999] bg-black/90 flex flex-col">
          <div className="relative flex-1">
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

          <div className="bg-[#111b21] p-4 space-y-4">
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full"
            />

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowCropper(false);
                  setImageSrc(null);
                }}
                className="flex-1 bg-zinc-700 text-white p-3 rounded-xl font-bold"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={createCroppedImage}
                disabled={uploading}
                className="flex-1 bg-emerald-500 text-black p-3 rounded-xl font-bold disabled:opacity-60"
              >
                {uploading ? "Uploading..." : "Crop & Upload"}
              </button>
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
          if (!blob) {
            reject(new Error("Canvas is empty"));
            return;
          }

          resolve(blob);
        },
        "image/jpeg",
        0.9
      );
    };

    image.onerror = reject;
  });
}