import { jwtVerify } from "jose";
import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "mr_session";

/**
 * Sends signed-out visitors on /admin pages to the sign-in page, remembering where they were
 * going. The admin layout and every admin action still check the session against the database.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (pathname === "/admin/login") return NextResponse.next();

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const secret = process.env.AUTH_SECRET;
  let valid = false;
  if (token && secret) {
    try {
      await jwtVerify(token, new TextEncoder().encode(secret), { algorithms: ["HS256"] });
      valid = true;
    } catch {
      valid = false;
    }
  } else if (token && process.env.NODE_ENV !== "production") {
    valid = true; // Development default secret: let the layout do the check.
  }
  if (valid) return NextResponse.next();

  // Downloads answer 401 instead of redirecting to an HTML page.
  if (pathname.endsWith("/export")) return new NextResponse("Sign in required.", { status: 401 });

  const login = new URL("/admin/login", request.url);
  login.searchParams.set("next", pathname + search);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/admin/:path*"],
};
