import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_COOKIE_NAME = "auth";

const protectedPaths = ["/books", "/my-books", "/profile", "/new-book"];

const guestPaths = ["/login"];

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const authToken = request.cookies.get(AUTH_COOKIE_NAME);
  const isProtected = protectedPaths.some((path) => pathname.startsWith(path));
  const isGuestPath = guestPaths.some((path) => pathname.startsWith(path));

  if (isProtected && !authToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isGuestPath && authToken) {
    return NextResponse.redirect(new URL("/books", request.url));
  }
  
  if (pathname === "/") {
    if (authToken) {
      return NextResponse.redirect(new URL("/books", request.url));
    } else {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login/:path*",
    "/books/:path*",
    "/my-books/:path*",
    "/profile/:path*",
    "/new-book/:path*",
  ],
};
