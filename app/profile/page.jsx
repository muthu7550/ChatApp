"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [form, setForm] = useState({
    name: "",
    about: "",
    avatar: "",
  });

  const [uploading, setUploading] = useState(false);

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

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "null");

    if (user) {
      setForm({
        name: user?.name || "",
        about: user?.about || "",
        avatar: user?.avatar || "",
      });
    }
  }, []);

  function handleRemovePhoto() {
    setForm((prev) => ({
      ...prev,
      avatar: "",
    }));
  }

  async function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const result = await res.json();

    setForm((prev) => ({
      ...prev,
      avatar: result?.url,
    }));

    setUploading(false);
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
                form?.name || "User",
              )}&background=00a884&color=fff`
            }
            className="w-32 h-32 rounded-full mx-auto object-cover"
            alt="profile"
          />

          <div className="flex gap-3 justify-center mt-4">
                     <label className="cursor-pointer bg-emerald-500 text-black px-5 py-2 rounded-xl font-bold">
            {uploading ? "Uploading..." : "Upload"}
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={handleImageUpload}
            />
          </label>

            <button
              onClick={handleRemovePhoto}
              className="bg-red-500 text-white px-4 py-2 rounded-xl"
            >
              Remove
            </button>
          </div>
        </div>

        <input
          className="w-full bg-[#202c33] p-3 rounded-xl outline-none"
          placeholder="Your name"
          value={form?.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        <textarea
          className="w-full bg-[#202c33] p-3 rounded-xl outline-none"
          placeholder="About"
          value={form?.about}
          onChange={(e) => setForm({ ...form, about: e.target.value })}
        />

        <button className="w-full bg-emerald-500 text-black font-bold p-3 rounded-xl">
          Continue to Chat
        </button>
      </form>
    </main>
  );
}
