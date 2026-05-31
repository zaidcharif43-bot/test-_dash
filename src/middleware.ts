import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const authCookie = request.cookies.get("dashboard-auth-user");

  // If already authenticated and accessing login path -> redirect to dashboard root (/)
  if (path === "/login" && authCookie) {
    console.log("[Middleware Guard] Authenticated user redirected from /login to dashboard root /");
    return NextResponse.redirect(new URL("/", request.url));
  }

  // If not authenticated and trying to access any route other than /login -> redirect to /login
  if (path !== "/login" && !authCookie) {
    console.log(`[Middleware Guard] Unauthenticated access blocked on: ${path}, redirecting to /login`);
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If authenticated, perform role-based validations
  if (authCookie) {
    try {
      const user = JSON.parse(decodeURIComponent(authCookie.value));
      
      // Strict role check: Manager and Client roles cannot access general /admin panel
      if (path.startsWith("/admin") && user.role !== "admin") {
        console.warn(`[Middleware Guard] Access denied: User ${user.name} (role: ${user.role}) attempted to open Admin path: ${path}`);
        return NextResponse.redirect(new URL("/", request.url));
      }

      // Strict role check: Client and Manager roles cannot access general /settings panel
      if (path.startsWith("/settings") && (user.role === "client" || user.role === "manager")) {
        console.warn(`[Middleware Guard] Access denied: User ${user.name} (role: ${user.role}) attempted to open Settings path: ${path}`);
        return NextResponse.redirect(new URL("/", request.url));
      }
    } catch (e) {
      console.error("[Middleware Guard] Session decryption error, resetting authorization:", e);
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("dashboard-auth-user");
      return response;
    }
  }

  return NextResponse.next();
}

// Optimized matcher config to only intercept page requests
export const config = {
  matcher: [
    "/",
    "/login",
    "/dashboard",
    "/publications",
    "/calendar",
    "/add-publication",
    "/tasks",
    "/team",
    "/messages",
    "/notifications",
    "/settings",
    "/admin/:path*"
  ]
};
