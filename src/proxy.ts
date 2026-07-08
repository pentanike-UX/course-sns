import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Personal areas with no signed-out view — direct visits redirect to /login.
// Browsing surfaces ("/", "/routes/[id]", "/u/[handle]") are PUBLIC: guests read
// freely and the in-app login sheet (AuthGate) gates write actions instead.
// "/feed" = the user's own diary drawer, not the public explore feed at "/".
const PROTECTED = ["/feed", "/profile", "/routes/new", "/library", "/notifications"];

export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  const needsAuth =
    PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`)) ||
    pathname.endsWith("/edit");

  if (needsAuth && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // already signed in → keep them out of the auth page
  if (pathname === "/login" && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    // run on everything except static assets and image files
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
