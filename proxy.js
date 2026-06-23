import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

export async function proxy(req) {
  const path = req.nextUrl.pathname;

  const publicRoutes = [
    "/api/auth/login",
    "/api/auth/register",
  ];

  const isPublicRoute = publicRoutes.some((route) =>
    path === route || path.startsWith(`${route}/`)
  );

  // Do not check token for login/register APIs
  if (isPublicRoute) {
    return NextResponse.next();
  }

  const authHeader = req.headers.get("authorization");

  const headerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.replace("Bearer ", "")
    : null;

  const cookieToken = req.cookies.get("token")?.value;

  const token = headerToken || cookieToken;

  if (!token) {
    return NextResponse.json(
      { success: false, logout: true, message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);

    await jwtVerify(token, secret);

    return NextResponse.next();
  } catch {
    return NextResponse.json(
      { success: false, logout: true, message: "Session expired" },
      { status: 401 }
    );
  }
}

export const config = {
  matcher: ["/api/:path*"],
};