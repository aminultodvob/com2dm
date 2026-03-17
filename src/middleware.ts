import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

type AuthRequest = NextRequest & { auth?: { user?: { id?: string } } | null };

export default auth((req: AuthRequest) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  // Public routes
  const publicRoutes = [
    "/",
    "/login",
    "/signup",
    "/pricing",
    "/api/auth",
    "/api/meta",
    "/api/webhooks",
  ];
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(route)
  );

  if (isPublicRoute) return NextResponse.next();

  // Dashboard requires auth
  if (pathname.startsWith("/dashboard") && !isLoggedIn) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect logged-in users away from auth pages
  if ((pathname === "/login" || pathname === "/signup") && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
