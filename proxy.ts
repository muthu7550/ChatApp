import { NextRequest, NextResponse } from "next/server";

export function proxy(req: NextRequest) {
  console.log("PROXY RUNNING:", req.nextUrl.pathname);

  const token = req.headers.get("authorization");

  if (!token) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};