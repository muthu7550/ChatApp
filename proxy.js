import { NextResponse } from "next/server";

export function proxy(req) {
  const token = req.cookies.get("token")?.value;
  const path = req.nextUrl.pathname;

  const authPages = ["/login", "/register"];
  const protectedPages = ["/chat", "/profile", "/call"];

  const isAuthPage = authPages.some((p) => path.startsWith(p));
  const isProtectedPage = protectedPages.some((p) => path.startsWith(p));

  if (isProtectedPage && !token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isAuthPage && token) {
    return NextResponse.redirect(new URL("/chat", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/register", "/chat/:path*", "/profile/:path*", "/call/:path*"],
};