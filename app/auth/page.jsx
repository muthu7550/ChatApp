"use client";

import { useState } from "react";
import "./auth.scss";

export default function AuthPage() {
  const [isRegister, setIsRegister] = useState(false);

  return (
    <main className="auth-flip-page">
      <div className="auth-orb orb-1" />
      <div className="auth-orb orb-2" />

      <section className={`flip-box ${isRegister ? "is-register" : ""}`}>
        <div className="flip-inner">
          <div className="flip-face flip-front">
            <LoginForm onSwitch={() => setIsRegister(true)} />
          </div>

          <div className="flip-face flip-back">
            <RegisterForm onSwitch={() => setIsRegister(false)} />
          </div>
        </div>
      </section>
    </main>
  );
}

function LoginForm({ onSwitch }) {
  return (
    <div className="auth-card">
      <div className="logo">C</div>
      <h1>Welcome Back</h1>
      <p>Login and continue your ChatterBox world.</p>

      <form className="form">
        <input type="email" placeholder="Email address" />
        <input type="password" placeholder="Password" />

        <button type="submit" className="main-btn">
          Login Now
        </button>
      </form>

      <button type="button" onClick={onSwitch} className="switch-btn">
        New user? Flip to Register
      </button>
    </div>
  );
}

function RegisterForm({ onSwitch }) {
  return (
    <div className="auth-card">
      <div className="logo">C</div>
      <h1>Create Account</h1>
      <p>Join chats, calls, groups and file sharing.</p>

      <form className="form">
        <input placeholder="Full name" />
        <input type="email" placeholder="Email address" />
        <input type="password" placeholder="Password" />

        <button type="submit" className="main-btn">
          Create Account
        </button>
      </form>

      <button type="button" onClick={onSwitch} className="switch-btn">
        Already joined? Flip to Login
      </button>
    </div>
  );
}