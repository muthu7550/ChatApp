"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { sendPhoneOtp } from "../lib/firebaseClient";
import "./auth.scss";

export default function AuthClient({ mode }) {
  const router = useRouter();

  const [isRegister, setIsRegister] = useState(mode === "register");
  const [authTab, setAuthTab] = useState("email"); // email / phone

  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });

  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [phoneForm, setPhoneForm] = useState({
    name: "",
    phone: "+91",
    otp: "",
  });

  const [confirmation, setConfirmation] = useState(null);
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

  function saveAuth(result) {
    localStorage.setItem("token", result.token);
    localStorage.setItem("user", JSON.stringify(result.user));
    document.cookie = `token=${result.token}; path=/; max-age=604800`;
    router.push(result?.user?.avatar ? "/chat" : "/profile");
  }

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

      saveAuth(result);
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

      saveAuth(result);
    } catch (error) {
      console.error("Register error:", error);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleSendOtp() {
    try {
      setLoading(true);

      if (!phoneForm.phone || phoneForm.phone.length < 10) {
        alert("Enter phone number with country code. Example: +919876543210");
        return;
      }

      const result = await sendPhoneOtp(phoneForm.phone);
      setConfirmation(result);
      alert("OTP sent successfully");
    } catch (error) {
      console.error("OTP send error:", error);
      alert(error?.message || "OTP send failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    try {
      setLoading(true);

      if (!confirmation) {
        alert("Send OTP first");
        return;
      }

      if (!phoneForm.otp.trim()) {
        alert("Enter OTP");
        return;
      }

      const firebaseResult = await confirmation.confirm(phoneForm.otp);
      const idToken = await firebaseResult.user.getIdToken();

      const res = await fetch("/api/auth/phone-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idToken,
          name: phoneForm.name,
        }),
      });

      const result = await res.json().catch(() => null);

      if (!res.ok || !result?.token) {
        alert(result?.error || "Phone login failed");
        return;
      }

      saveAuth(result);
    } catch (error) {
      console.error("OTP verify error:", error);
      alert(error?.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  }

  function goRegister() {
    setIsRegister(true);
    setErrors({});
    setTimeout(() => router.push("/auth/register"), 850);
  }

  function goLogin() {
    setIsRegister(false);
    setErrors({});
    setTimeout(() => router.push("/auth/login"), 850);
  }

  return (
    <main className="auth-page">
      <div className="glow glow-1" />
      <div className="glow glow-2" />
      <div className="glow glow-3" />

      <div id="recaptcha-container" />

      <section className={`flip-scene ${isRegister ? "flipped" : ""}`}>
        <div className="flip-card">
          <div className="card-face login-face">
            <div className="auth-card">
              <div className="logo">C</div>

              <h1>Welcome Back</h1>
              <p>Login to continue your ChatterBox world.</p>

              <div className="d-flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setAuthTab("email")}
                  className={`btn flex-fill rounded-4 fw-bold ${
                    authTab === "email"
                      ? "btn-light border border-4"
                      : "btn-outline-light border border-1 text-muted"
                  }`}
                >
                  Email
                </button>

                <button
                  type="button"
                  onClick={() => setAuthTab("phone")}
                  className={`btn flex-fill rounded-4 fw-bold text-dark ${
                    authTab === "phone"
                      ? "btn-light border border-4"
                      : "btn-outline-light border border-1"
                  }`}
                >
                  Mobile
                </button>
              </div>

              {authTab === "email" && (
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
              )}

              {authTab === "phone" && (
                <div className="auth-form">
                  {!confirmation && (
                    <div className="position-relative rounded-4 overflow-hidden border border-secondary">
                      {/* Blurred Content */}
                      <div
                        className="p-3"
                        style={{
                          filter: "blur(3px)",
                          opacity: 0.35,
                          pointerEvents: "none",
                          userSelect: "none",
                        }}
                      >
                        <input
                          className="form-control mb-3"
                          placeholder="Name for new user"
                          value={phoneForm.name}
                          onChange={(e) =>
                            setPhoneForm({
                              ...phoneForm,
                              name: e.target.value,
                            })
                          }
                        />

                        <input
                          className="form-control mb-3"
                          placeholder="+91XXXXXXXXXX"
                          value={phoneForm.phone}
                          onChange={(e) =>
                            setPhoneForm({
                              ...phoneForm,
                              phone: e.target.value,
                            })
                          }
                        />

                        <button
                          type="button"
                          disabled={loading}
                          onClick={handleSendOtp}
                          className="main-btn w-100"
                        >
                          {loading ? "Sending OTP..." : "Send OTP"}
                        </button>
                      </div>

                      {/* Overlay */}
                      <div
                        className="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column justify-content-center align-items-center text-center p-4"
                        style={{
                          background: "rgba(10,15,20,.65)",
                          backdropFilter: "blur(8px)",
                          zIndex: 10,
                        }}
                      >
                        <span
                          className="badge rounded-pill px-4 py-2 mb-3 fs-6 shadow"
                          style={{
                            background:
                              "linear-gradient(135deg,#ff9d2e,#ff5b2f)",
                          }}
                        >
                          🚀 COMING SOON
                        </span>

                        <h5 className="fw-bold text-white mb-2">
                          Phone Login is Coming Soon
                        </h5>

                        <p className="text-light opacity-75 mb-4 small">
                          This feature is currently under development.
                          <br />
                          Please login using your Email & Password.
                        </p>

                        <button
                          type="button"
                          className="btn btn-success rounded-pill px-4 fw-semibold"
                          onClick={() => {
                            setAuthTab("email"); // or whatever state switches back to email login
                          }}
                        >
                          ← Continue with Email Login
                        </button>
                      </div>
                    </div>
                  )}

                  {confirmation && (
                    <>
                      <input
                        placeholder="Enter OTP"
                        value={phoneForm.otp}
                        onChange={(e) =>
                          setPhoneForm({
                            ...phoneForm,
                            otp: e.target.value,
                          })
                        }
                      />

                      <button
                        type="button"
                        disabled={loading}
                        onClick={handleVerifyOtp}
                        className="main-btn"
                      >
                        {loading ? "Verifying..." : "Verify & Login"}
                      </button>

                      <button
                        type="button"
                        className="switch-btn"
                        onClick={() => {
                          setConfirmation(null);
                          setPhoneForm({ ...phoneForm, otp: "" });
                        }}
                      >
                        Change mobile number
                      </button>
                    </>
                  )}
                </div>
              )}

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
