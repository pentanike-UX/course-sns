import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Service-role Supabase client (server-only). Bypasses RLS, so NEVER expose it
 * to the browser and always enforce ownership in the calling code.
 *
 * Needed because this project signs user JWTs with asymmetric (ES256) keys that
 * the Storage service can't validate — uploads authenticated with the user
 * token are rejected. We therefore mint signed upload URLs with the service
 * role and have the client upload to those instead.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set — see .env.example");
  }
  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
