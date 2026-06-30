import { NextResponse } from "next/server";
import { dbConnect } from "../../../../lib/db";
import User from "../../../../models/User";
import { createToken } from "../../../../lib/jwt";

export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/auth/login?error=google_code_missing`
      );
    }

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok) {
      console.error("GOOGLE TOKEN ERROR:", tokenData);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/auth/login?error=google_token_failed`
      );
    }

    const profileRes = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      }
    );

    const profile = await profileRes.json();

    if (!profile?.email) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/auth/login?error=google_email_missing`
      );
    }

    let user = await User.findOne({ email: profile.email });

    if (!user) {
      user = await User.create({
        name: profile.name || "Google User",
        email: profile.email,
        avatar: profile.picture || "",
        provider: "google",
        providerId: profile.id,
        blockedUsers: [],
      });
    } else {
      user.provider = user.provider || "google";
      user.providerId = user.providerId || profile.id;
      if (!user.avatar && profile.picture) user.avatar = profile.picture;
      await user.save();
    }

    const token = await createToken({
      userId: user._id.toString(),
      email: user.email,
    });

    const redirectUrl = new URL(`${process.env.NEXT_PUBLIC_APP_URL}/auth/oauth-success`);
    redirectUrl.searchParams.set("token", token);
    redirectUrl.searchParams.set(
      "user",
      encodeURIComponent(
        JSON.stringify({
          _id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar || "",
          about: user.about || "",
          blockedUsers: user.blockedUsers || [],
        })
      )
    );

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error("GOOGLE CALLBACK ERROR:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/auth/login?error=google_failed`
    );
  }
}