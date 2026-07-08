import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "./database.types";

/**
 * Refreshes the Supabase auth session on every request and keeps cookies in
 * sync. Returns the response (with refreshed cookies) plus the current user.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: keep this directly after createServerClient. getClaims() reads
  // the session (refreshing the token and writing cookies via setAll when it's
  // near expiry) and verifies the project's asymmetric JWT locally — avoiding a
  // remote /auth/v1/user round-trip on every request. Falls back to getUser()
  // only if claim verification errors.
  let user: { id: string } | null = null;
  const { data: claimsData, error } = await supabase.auth.getClaims();
  if (!error) {
    const claims = claimsData?.claims as { sub?: string } | undefined;
    user = claims?.sub ? { id: claims.sub } : null;
  } else {
    const {
      data: { user: u },
    } = await supabase.auth.getUser();
    user = u ? { id: u.id } : null;
  }

  return { response, user };
}
