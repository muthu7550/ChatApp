import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();


export function createTransporter() {
  console.log("SMTP CONFIG:", {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    user: process.env.SMTP_USER,
  });

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || 465),
    secure: Number(process.env.SMTP_PORT || 465) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,

      
    },
  });
}

export function otpTemplate({ name = "User", otp }) {
  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
</head>

<body style="margin:0;padding:40px;background:#f5f7fb;font-family:Arial,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td align="center">

<table
style="
max-width:560px;
width:100%;
background:#ffffff;
border-radius:24px;
overflow:hidden;
box-shadow:0 15px 45px rgba(0,0,0,.08);
">

<tr>
<td
style="
padding:20px;
text-align:center;
background:linear-gradient(135deg,#ff9d2e,#ff5b2f);
color:white;
">

<div style="font-size:56px">
💬
</div>

<h1
style="
margin:15px 0 5px;
font-size:30px;
">
ChatterBox
</h1>

<p
style="
margin:0;
opacity:.9;
font-size:16px;
">
Email Verification
</p>

</td>
</tr>

<tr>
<td style="padding:40px">

<h2
style="
margin-top:0;
font-size:28px;
color:#111827;
">
Hi ${name},
</h2>

<p
style="
color:#6b7280;
font-size:16px;
line-height:28px;
margin-bottom:30px;
">
Use the verification code below to continue.
For your security, never share this code with anyone.
</p>

<div
style="
background:#fff4eb;
border:2px dashed #ff9d2e;
border-radius:18px;
padding:25px;
text-align:center;
">

<div
style="
font-size:13px;
letter-spacing:2px;
text-transform:uppercase;
color:#ff5b2f;
font-weight:bold;
margin-bottom:10px;
">
Verification Code
</div>

<div
style="
font-size:52px;
font-weight:900;
letter-spacing:14px;
color:#111827;
font-family:monospace;
">
${otp}
</div>

</div>

<p
style="
margin-top:18px;
text-align:center;
font-size:14px;
color:#6b7280;
">
Simply copy this code manually and paste it into the app.
</p>

<hr
style="
margin:35px 0;
border:none;
border-top:1px solid #ececec;
">

<p
style="
font-size:14px;
color:#6b7280;
line-height:24px;
margin:0;
">
⏱ This OTP expires in
<strong>5 minutes</strong>.
</p>

<p
style="
font-size:14px;
color:#6b7280;
line-height:24px;
">
If you didn't request this verification,
you can safely ignore this email.
</p>

</td>
</tr>

<tr>
<td
style="
background:#fafafa;
padding:25px;
text-align:center;
font-size:13px;
color:#999;
">

© ${new Date().getFullYear()} ChatterBox

<br><br>

Made with ❤️ by ChatterBox Team

</td>
</tr>

</table>

</td>
</tr>
</table>

</body>
</html>
`;
}