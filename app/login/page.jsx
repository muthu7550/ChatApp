"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form?.email || !form?.password) {
      alert("Email and password required");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const result = await res.json().catch(() => null);

      if (!res.ok || !result?.token) {
        alert(result?.error || "Login failed");
        return;
      }

      localStorage.setItem("token", result?.token);
      localStorage.setItem("user", JSON.stringify(result?.user));

      document.cookie = `token=${result?.token}; path=/; max-age=604800`;

      if (!result?.user?.avatar) {
        router.push("/profile");
      } else {
        router.push("/chat");
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const expired = localStorage.getItem("sessionMessage");

    if (expired) {
      setSessionExpired(true);
      sessionStorage.removeItem("sessionExpired");
    }
  }, []);

  function goToRegister() {
    router.push("/register");
  }

  return (
    <main className="min-h-screen bg-zinc-950 flex items-center justify-center text-dark px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-zinc-900 p-8 rounded-3xl space-y-4 shadow-2xl"
      >
        <div className="text-center">
          <div className="text-6xl mb-3">😂</div>

          <h1 className="text-3xl font-black">Login ChatterBox</h1>

          <p className="text-zinc-400 text-sm mt-2">
            Welcome back! Chat, call, share files and location.
          </p>
        </div>

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
          {loading ? "Checking..." : "Login"}
        </button>

        <div className="text-center border-t border-zinc-800 pt-4">
          <p className="text-sm text-zinc-400">New user?</p>

          <button
            type="button"
            onClick={goToRegister}
            className="mt-2 w-full border border-emerald-500 text-emerald-400 font-bold p-3 rounded-xl hover:bg-emerald-500 hover:text-black transition"
          >
            Create New Account
          </button>
        </div>
      </form>

      {sessionExpired && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{
            background: "rgba(0,0,0,0.75)",
            zIndex: 99999,
          }}
        >
          <div
            className="bg-dark text-dark p-4 rounded-4 shadow-lg text-center"
            style={{
              width: "90%",
              maxWidth: "420px",
            }}
          >
            <div style={{ fontSize: "60px" }}>⏰</div>

            <h3 className="fw-bold mt-3">Session Expired</h3>

            <p className="text-secondary mt-3">
              Your login session has expired for security reasons. Please sign
              in again to continue.
            </p>

            <button
              className="btn btn-success w-100 mt-3"
              onClick={() => {
                setSessionExpired(false)
  localStorage.removeItem("sessionMessage");

              }
              }
            >
              Login Again
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
