"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "./auth.scss";

export default function AuthClient({ mode }) {
  const router = useRouter();

  const [isRegister, setIsRegister] = useState(mode === "register");

  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });

  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    setIsRegister(mode === "register");
    setErrors({});
  }, [mode]);

  useEffect(() => {
    const expired = localStorage.getItem("sessionMessage");
    if (expired) setSessionExpired(true);
  }, []);

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function validateLogin() {
    const newErrors = {};

    if (!loginForm.email.trim()) {
      newErrors.loginEmail = "Email is required";
    } else if (!isValidEmail(loginForm.email)) {
      newErrors.loginEmail = "Enter a valid email";
    }

    if (!loginForm.password.trim()) {
      newErrors.loginPassword = "Password is required";
    } else if (loginForm.password.length < 6) {
      newErrors.loginPassword = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function validateRegister() {
    const newErrors = {};

    if (!registerForm.name.trim()) {
      newErrors.registerName = "Full name is required";
    } else if (registerForm.name.trim().length < 3) {
      newErrors.registerName = "Name must be at least 3 characters";
    }

    if (!registerForm.email.trim()) {
      newErrors.registerEmail = "Email is required";
    } else if (!isValidEmail(registerForm.email)) {
      newErrors.registerEmail = "Enter a valid email";
    }

    if (!registerForm.password.trim()) {
      newErrors.registerPassword = "Password is required";
    } else if (registerForm.password.length < 6) {
      newErrors.registerPassword = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleLogin(e) {
    e.preventDefault();

    if (!validateLogin()) return;

    try {
      setLoading(true);

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginForm),
      });

      const result = await res.json().catch(() => null);

      if (!res.ok || !result?.token) {
        alert(result?.error || "Login failed");
        return;
      }

      localStorage.setItem("token", result.token);
      localStorage.setItem("user", JSON.stringify(result.user));

      document.cookie = `token=${result.token}; path=/; max-age=604800`;

      router.push(result?.user?.avatar ? "/chat" : "/profile");
    } catch (error) {
      console.error("Login error:", error);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();

    if (!validateRegister()) return;

    try {
      setLoading(true);

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(registerForm),
      });

      const result = await res.json().catch(() => null);

      if (!res.ok || !result?.token) {
        alert(result?.error || "Registration failed");
        return;
      }

      localStorage.setItem("token", result.token);
      localStorage.setItem("user", JSON.stringify(result.user));

      document.cookie = `token=${result.token}; path=/; max-age=604800`;

      router.push("/profile");
    } catch (error) {
      console.error("Register error:", error);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function goRegister() {
    setIsRegister(true);
    setErrors({});

    setTimeout(() => {
      router.push("/auth/register");
    }, 850);
  }

  function goLogin() {
    setIsRegister(false);
    setErrors({});

    setTimeout(() => {
      router.push("/auth/login");
    }, 850);
  }

  return (
    <main className="auth-page">
      <div className="glow glow-1" />
      <div className="glow glow-2" />
      <div className="glow glow-3" />

      <section className={`flip-scene ${isRegister ? "flipped" : ""}`}>
        <div className="flip-card">
          <div className="card-face login-face">
            <div className="auth-card">
              <div className="logo">C</div>

              <h1>Welcome Back</h1>
              <p>Login to continue your ChatterBox world.</p>

              <form className="auth-form" onSubmit={handleLogin}>
                <input
                  type="email"
                  placeholder="Email address"
                  value={loginForm.email}
                  onChange={(e) =>
                    setLoginForm({
                      ...loginForm,
                      email: e.target.value,
                    })
                  }
                />
                {errors.loginEmail && (
                  <small className="error-text">{errors.loginEmail}</small>
                )}

                <input
                  type="password"
                  placeholder="Password"
                  value={loginForm.password}
                  onChange={(e) =>
                    setLoginForm({
                      ...loginForm,
                      password: e.target.value,
                    })
                  }
                />
                {errors.loginPassword && (
                  <small className="error-text">{errors.loginPassword}</small>
                )}

                <button
                  type="button"
                  className="forgot-btn"
                  onClick={() => router.push("/auth/forgot-password")}
                >
                  Forgot Password?
                </button>

                <button type="submit" disabled={loading} className="main-btn">
                  {loading ? "Checking..." : "Login Now"}
                </button>
              </form>

              <button type="button" onClick={goRegister} className="switch-btn">
                New user? Flip to Register
              </button>
            </div>
          </div>

          <div className="card-face register-face">
            <div className="auth-card">
              <div className="logo">C</div>

              <h1>Create Account</h1>
              <p>Join chats, calls, groups and file sharing.</p>

              <form className="auth-form" onSubmit={handleRegister}>
                <input
                  placeholder="Full name"
                  value={registerForm.name}
                  onChange={(e) =>
                    setRegisterForm({
                      ...registerForm,
                      name: e.target.value,
                    })
                  }
                />
                {errors.registerName && (
                  <small className="error-text">{errors.registerName}</small>
                )}

                <input
                  type="email"
                  placeholder="Email address"
                  value={registerForm.email}
                  onChange={(e) =>
                    setRegisterForm({
                      ...registerForm,
                      email: e.target.value,
                    })
                  }
                />
                {errors.registerEmail && (
                  <small className="error-text">{errors.registerEmail}</small>
                )}

                <input
                  type="password"
                  placeholder="Password"
                  value={registerForm.password}
                  onChange={(e) =>
                    setRegisterForm({
                      ...registerForm,
                      password: e.target.value,
                    })
                  }
                />
                {errors.registerPassword && (
                  <small className="error-text">
                    {errors.registerPassword}
                  </small>
                )}

                <button type="submit" disabled={loading} className="main-btn">
                  {loading ? "Creating..." : "Create Account"}
                </button>
              </form>

              <button type="button" onClick={goLogin} className="switch-btn">
                Already joined? Flip to Login
              </button>
            </div>
          </div>
        </div>
      </section>

      {sessionExpired && (
        <div className="modal-layer">
          <div className="session-box">
            <div className="session-icon">⏰</div>

            <h2>Session Expired</h2>

            <p>Please login again to continue securely.</p>

            <button
              onClick={() => {
                setSessionExpired(false);
                localStorage.removeItem("sessionMessage");
              }}
              className="main-btn"
            >
              Login Again
            </button>
          </div>
        </div>
      )}
    </main>
  );
}