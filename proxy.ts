import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const authRoutes = [
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/complete-profile",
  "/login",
  "/register",
];

// Browsable without login: doctors list, doctor details and legal pages.
// The dashboard, booking and everything personal need login.
const publicRoutes = ["/find-doctors", "/privacy-policy", "/terms-conditions"];

const isPublicRoute = (path: string) =>
  publicRoutes.some((route) => path === route || path.startsWith(`${route}/`));

export function proxy(request: NextRequest) {
  const token = request.cookies.get("patient_token")?.value;
  const role = request.cookies.get("patient_role")?.value;
  const path = request.nextUrl.pathname;

  const isAuthRoute = authRoutes.some((route) => path.startsWith(route));

  // 🔒 1. If NOT logged in → public pages are fine, anything else goes to login (and comes back after)
  if (!token && !isAuthRoute) {
    if (isPublicRoute(path)) {
      return NextResponse.next();
    }

    // Guests only get the doctor search, so the home page opens it.
    if (path === "/") {
      return NextResponse.redirect(new URL("/find-doctors", request.url));
    }

    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("redirect", path + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  // 🔒 2. Patient-only routes
  if (token && role !== "patient") {
    if (!isAuthRoute && path !== "/unauthorized") {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
  }

  // 🔁 3. Prevent logged-in users from accessing auth pages
  if (isAuthRoute && token && role) {
    if (role === "patient") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next|favicon.ico|manifest.webmanifest|manifest.json|assets|icons).*)",
  ],
};
