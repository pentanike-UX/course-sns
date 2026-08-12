import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { safeNextPath } from "@/lib/safe-next";

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
    url.search = "";
    url.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(url);
  }

  // already signed in → leave /login; honor ?next= (create / follow resume)
  if (pathname === "/login" && user) {
    const dest = safeNextPath(request.nextUrl.searchParams.get("next"));
    return NextResponse.redirect(new URL(dest, request.url));
  }

  return response;
}

export const config = {
  matcher: [
    // run on everything except static assets and image files
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
