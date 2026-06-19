"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form?.name || !form?.email || !form?.password) {
      alert("All fields are required");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const result = await res.json().catch(() => null);

      if (!res.ok || !result?.token) {
        alert(result?.error || "Registration failed");
        return;
      }

      localStorage.setItem("token", result?.token);
      localStorage.setItem("user", JSON.stringify(result?.user));

      document.cookie = `token=${result?.token}; path=/; max-age=604800`;

      router.push("/profile");
    } catch (error) {
      console.error(error);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function goToLogin() {
    router.push("/login");
  }

  return (
    <main className="min-h-screen bg-zinc-950 flex items-center justify-center text-white px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-zinc-900 p-8 rounded-3xl space-y-4 shadow-2xl"
      >
        <div className="text-center">
          <div className="text-6xl mb-3">😂</div>

          <h1 className="text-3xl font-black">
            Create ChatterBox
          </h1>

          <p className="text-zinc-400 text-sm mt-2">
            Join the network. Chat, call, share files and location.
          </p>
        </div>

        <input
          className="w-full p-3 rounded-xl bg-zinc-800 outline-none border border-zinc-700 focus:border-emerald-500"
          placeholder="Full Name"
          value={form?.name}
          onChange={(e) =>
            setForm({
              ...form,
              name: e.target.value,
            })
          }
        />

        <input
          className="w-full p-3 rounded-xl bg-zinc-800 outline-none border border-zinc-700 focus:border-emerald-500"
          placeholder="Email"
          type="email"
          value={form?.email}
          onChange={(e) =>
            setForm({
              ...form,
              email: e.target.value,
            })
          }
        />

        <input
          className="w-full p-3 rounded-xl bg-zinc-800 outline-none border border-zinc-700 focus:border-emerald-500"
          placeholder="Password"
          type="password"
          value={form?.password}
          onChange={(e) =>
            setForm({
              ...form,
              password: e.target.value,
            })
          }
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-500 text-black font-bold p-3 rounded-xl disabled:opacity-60"
        >
          {loading ? "Creating..." : "Create Account"}
        </button>

        <div className="text-center border-t border-zinc-800 pt-4">
          <p className="text-sm text-zinc-400">
            Already have an account?
          </p>

          <button
            type="button"
            onClick={goToLogin}
            className="mt-2 w-full border border-emerald-500 text-emerald-400 font-bold p-3 rounded-xl hover:bg-emerald-500 hover:text-black transition"
          >
            Login Instead
          </button>
        </div>
      </form>
    </main>
  );
}