"use client";

import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!email.trim()) {
      alert("Email is required");
      return;
    }

    try {
      setLoading(true);

      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      setModal(true);
    } catch (error) {
      console.error(error);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[linear-gradient(135deg,#ff9d2e,#ff5b2f)] px-4">
      <div className="absolute left-[10%] top-[15%] h-44 w-44 animate-[blob_8s_ease-in-out_infinite] rounded-full bg-white/25 blur-3xl" />
      <div className="absolute bottom-[15%] right-[10%] h-56 w-56 animate-[blob_8s_ease-in-out_infinite_2s] rounded-full bg-white/25 blur-3xl" />

      <section className="relative z-10 w-full max-w-md animate-[cardEnter_.6s_ease] rounded-[30px] border border-white/60 bg-white p-8 shadow-2xl">
        <div className="mx-auto mb-6 grid h-16 w-16 animate-[float_3s_ease-in-out_infinite] place-items-center rounded bg-[linear-gradient(135deg,#ff9d2e,#ff5b2f)] text-3xl font-black text-white">
          🔐
        </div>

        <h1 className="text-center text-3xl font-black text-zinc-900">
          Reset Password
        </h1>

        <p className="mt-3 text-center text-sm text-zinc-500">
          Enter your email to receive reset instructions.
        </p>

        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded border border-orange-200 bg-orange-50/70 p-4 text-zinc-900 outline-none transition focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10"
          />

          <button
            disabled={loading}
            className="w-full rounded bg-[linear-gradient(135deg,#ff9d2e,#ff5b2f)] p-4 font-black text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl disabled:opacity-60"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Link
            href="/auth/login"
            className="rounded border border-orange-200 p-3 text-center text-sm font-black text-orange-600 no-underline transition hover:bg-orange-50"
          >
            Login
          </Link>

          <Link
            href="/"
            className="rounded border border-orange-200 p-3 text-center text-sm font-black text-orange-600 no-underline transition hover:bg-orange-50"
          >
            Home
          </Link>
        </div>
      </section>

      {modal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-4">
          <div className="w-full max-w-sm animate-[cardEnter_.4s_ease] rounded-[28px] bg-white p-7 text-center shadow-2xl">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-500 text-3xl font-black text-white">
              ✓
            </div>

            <h2 className="mt-5 text-2xl font-black text-zinc-900">
              Email Sent
            </h2>

            <p className="mt-2 text-sm text-zinc-500">
              Check your inbox for reset instructions.
            </p>

            <Link
              href="/"
              className="mt-6 block rounded bg-[linear-gradient(135deg,#ff9d2e,#ff5b2f)] p-4 font-black text-white no-underline transition hover:-translate-y-1"
            >
              Return to Home
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}