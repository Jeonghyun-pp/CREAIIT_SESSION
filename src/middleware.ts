import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Lightweight middleware — just check if the auth session cookie exists.
// Real auth verification happens in AdminLayout (server component) and API routes.
export function middleware(request: NextRequest) {
  const sessionCookie =
    request.cookies.get("authjs.session-token") ||
    request.cookies.get("__Secure-authjs.session-token");

  if (!sessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
