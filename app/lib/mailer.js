import nodemailer from "nodemailer";

export function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export function otpTemplate({ name = "User", otp }) {
  return `
  <div style="font-family:Arial;background:#fff7f1;padding:30px">
    <div style="max-width:520px;margin:auto;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 20px 50px rgba(0,0,0,.12)">
      <div style="background:linear-gradient(135deg,#ff9d2e,#ff5b2f);padding:28px;text-align:center;color:white">
        <h1 style="margin:0">ChatterBox 🔐</h1>
        <p style="margin:8px 0 0">Email Verification OTP</p>
      </div>

      <div style="padding:30px;text-align:center">
        <h2 style="color:#111">Hi ${name},</h2>
        <p style="color:#555">Use this OTP to verify your account.</p>

        <div style="font-size:34px;font-weight:900;letter-spacing:8px;color:#ff5b2f;background:#fff3eb;padding:18px;border-radius:18px;margin:24px 0">
          ${otp}
        </div>

        <p style="color:#777;font-size:14px">This OTP expires in 5 minutes.</p>
        <p style="color:#999;font-size:12px">If you did not request this, ignore this email.</p>
      </div>
    </div>
  </div>`;
}