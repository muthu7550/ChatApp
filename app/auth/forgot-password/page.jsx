"use client";

import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    email: "",
    otp: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  function updateField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function sendOtp(e) {
    e.preventDefault();

    if (!form.email.trim()) {
      alert("Email is required");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email.trim().toLowerCase() }),
      });

      const result = await res.json().catch(() => null);

      if (!res.ok || !result?.success) {
        alert(result?.error || "OTP send failed");
        return;
      }

      setStep(2);
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword(e) {
    e.preventDefault();

    if (!form.otp.trim()) {
      alert("OTP is required");
      return;
    }

    if (form.password.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }

    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email.trim().toLowerCase(),
          otp: form.otp.trim(),
          password: form.password,
        }),
      });

      const result = await res.json().catch(() => null);

      if (!res.ok || !result?.success) {
        alert(result?.error || "Password reset failed");
        return;
      }

      setSuccess(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-vh-100 d-flex align-items-center justify-content-center px-3 position-relative overflow-hidden"
      style={{ background: "linear-gradient(135deg,#ff9d2e,#ff5b2f)" }}
    >
      <div className="position-absolute rounded-circle bg-white opacity-25 blur"
        style={{ width: 220, height: 220, top: "12%", left: "8%", filter: "blur(55px)" }}
      />
      <div className="position-absolute rounded-circle bg-white opacity-25"
        style={{ width: 260, height: 260, bottom: "10%", right: "8%", filter: "blur(65px)" }}
      />

      <section className="bg-white shadow-lg position-relative w-100 p-4 p-sm-5"
        style={{ maxWidth: 460, borderRadius: 34 }}
      >
        <div className="mx-auto mb-4 d-flex align-items-center justify-content-center text-white fw-black"
          style={{
            width: 76,
            height: 76,
            borderRadius: 24,
            background: "linear-gradient(135deg,#ff9d2e,#ff5b2f)",
            fontSize: 36,
          }}
        >
          🔐
        </div>

        {!success ? (
          <>
            <h1 className="text-center fw-bold mb-2">
              {step === 1 ? "Forgot Password?" : "Verify OTP"}
            </h1>

            <p className="text-center text-secondary small mb-4">
              {step === 1
                ? "Enter your email and we will send a secure OTP."
                : `OTP sent to ${form.email}`}
            </p>

            {step === 1 ? (
              <form onSubmit={sendOtp}>
                <input
                  type="email"
                  placeholder="Email address"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  className="form-control form-control-lg rounded-4 mb-3 border-warning-subtle"
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="btn w-100 rounded-4 py-3 fw-bold text-white border-0"
                  style={{ background: "linear-gradient(135deg,#ff9d2e,#ff5b2f)" }}
                >
                  {loading ? "Sending OTP..." : "Send OTP"}
                </button>
              </form>
            ) : (
              <form onSubmit={resetPassword}>
                <input
                  placeholder="Enter 6 digit OTP"
                  value={form.otp}
                  onChange={(e) => updateField("otp", e.target.value)}
                  className="form-control form-control-lg rounded-4 mb-3 text-center fw-bold"
                  maxLength={6}
                />

                <input
                  type="password"
                  placeholder="New password"
                  value={form.password}
                  onChange={(e) => updateField("password", e.target.value)}
                  className="form-control form-control-lg rounded-4 mb-3"
                />

                <input
                  type="password"
                  placeholder="Confirm password"
                  value={form.confirmPassword}
                  onChange={(e) => updateField("confirmPassword", e.target.value)}
                  className="form-control form-control-lg rounded-4 mb-3"
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="btn w-100 rounded-4 py-3 fw-bold text-white border-0"
                  style={{ background: "linear-gradient(135deg,#ff9d2e,#ff5b2f)" }}
                >
                  {loading ? "Resetting..." : "Reset Password"}
                </button>

                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn btn-light w-100 rounded-4 py-3 fw-bold mt-2"
                >
                  Change Email
                </button>
              </form>
            )}

            <div className="d-flex gap-2 mt-4">
              <Link href="/auth/login" className="btn btn-light flex-fill rounded-4 fw-bold">
                Login
              </Link>
              <Link href="/" className="btn btn-light flex-fill rounded-4 fw-bold">
                Home
              </Link>
            </div>
          </>
        ) : (
          <div className="text-center">
            <div className="mx-auto mb-3 d-flex align-items-center justify-content-center text-white bg-success rounded-circle"
              style={{ width: 76, height: 76, fontSize: 34 }}
            >
              ✓
            </div>

            <h2 className="fw-bold">Password Reset Done</h2>
            <p className="text-secondary small">
              Your password has been updated successfully.
            </p>

            <Link
              href="/auth/login"
              className="btn w-100 rounded-4 py-3 fw-bold text-white border-0 mt-3"
              style={{ background: "linear-gradient(135deg,#ff9d2e,#ff5b2f)" }}
            >
              Login Now
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}