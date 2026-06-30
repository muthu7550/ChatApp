import { NextResponse } from "next/server";
import { dbConnect } from "../../../../lib/db";
import User from "../../../../models/User";
import { createToken } from "../../../../lib/jwt";

function getAppUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(
    /\/$/,
    ""
  );
}

export async function GET(req) {
  const APP_URL = getAppUrl();

  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.redirect(
        `${APP_URL}/auth/login?error=github_code_missing`
      );
    }

    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: `${APP_URL}/api/auth/github/callback`,
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData?.access_token) {
      console.error("GITHUB TOKEN ERROR:", tokenData);
      return NextResponse.redirect(
        `${APP_URL}/auth/login?error=github_token_failed`
      );
    }

    const profileRes = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: "application/vnd.github+json",
      },
    });

    const profile = await profileRes.json();

    const emailRes = await fetch("https://api.github.com/user/emails", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: "application/vnd.github+json",
      },
    });

    const emails = await emailRes.json();

    const primaryEmail =
      Array.isArray(emails) &&
      emails.find((item) => item.primary && item.verified)?.email;

    const email = primaryEmail || profile?.email;

    if (!email) {
      return NextResponse.redirect(
        `${APP_URL}/auth/login?error=github_email_missing`
      );
    }

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name: profile.name || profile.login || "GitHub User",
        email,
        avatar: profile.avatar_url || "",
        provider: "github",
        providerId: String(profile.id),
        blockedUsers: [],
      });
    } else {
      user.provider = user.provider || "github";
      user.providerId = user.providerId || String(profile.id);
      if (!user.avatar && profile.avatar_url) user.avatar = profile.avatar_url;
      await user.save();
    }

    const token = await createToken({
      userId: user._id.toString(),
      email: user.email,
    });

    const redirectUrl = new URL(`${APP_URL}/auth/oauth-success`);
    redirectUrl.searchParams.set("token", token);
    redirectUrl.searchParams.set(
      "user",
      JSON.stringify({
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        avatar: user.avatar || "",
        about: user.about || "",
        blockedUsers: user.blockedUsers || [],
      })
    );

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error("GITHUB CALLBACK ERROR:", error);
    return NextResponse.redirect(`${APP_URL}/auth/login?error=github_failed`);
  }
}