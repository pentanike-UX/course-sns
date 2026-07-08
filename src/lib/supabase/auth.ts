import "server-only";
import { cache } from "react";
import { createClient } from "./server";

/**
 * One Supabase server client per request (React cache dedupes it), so the many
 * data reads in a single render don't each reconstruct a client or re-fetch the
 * JWKS used to verify the session.
 */
export const getServerClient = cache(createClient);

export type AuthUser = { id: string; email?: string };

/**
 * The authenticated user for the current request.
 *
 * Verified with getClaims() — which validates the project's asymmetric (ES256)
 * JWT locally instead of doing a remote round-trip per call — and deduped per
 * render with React cache(). Falls back to the remote getUser() only if claims
 * are unavailable. This replaces the repeated `auth.getUser()` calls (middleware
 * + every data function) that dominated navigation latency.
 */
export const getAuthUser = cache(async (): Promise<AuthUser | null> => {
  const supabase = await getServerClient();

  try {
    const { data } = await supabase.auth.getClaims();
    const claims = data?.claims as { sub?: string; email?: string } | undefined;
    if (claims?.sub) {
      return { id: claims.sub, email: claims.email };
    }
  } catch {
    // fall through to the remote check
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ? { id: user.id, email: user.email ?? undefined } : null;
});
