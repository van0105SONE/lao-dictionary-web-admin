// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedPaths = ["/admin"];

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  console.log("middle it work");
  // Check if path starts with any protected route
  const isProtected = protectedPaths.some((path) => pathname.startsWith(path));

  if (!isProtected) {
    return NextResponse.next();
  }

  // Check for session cookie
  const sessionCookie = request.cookies.get("auth_session"); // Your cookie name

  if (!sessionCookie) {
    // Redirect to login with return URL
    const loginUrl = new URL("/", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Optional: Validate role here if needed
  // Decode JWT or call getCurrentUser() if cookie is JWT

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"], // Apply to all /admin routes
};
