import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/safe-next";

/**
 * Email-confirmation / OAuth callback. Supabase sends the user here with a
 * `?code=` which we exchange for a session (cookies set on this response),
 * then land on `next` via location.replace so /login · Google · /auth/callback
 * do not remain under the create/detail stack (Back → home / prior screen).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocal = process.env.NODE_ENV === "development";
  const base = isLocal || !forwardedHost ? origin : `https://${forwardedHost}`;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return replaceRedirect(`${base}${next}`);
    }
  }

  return replaceRedirect(`${base}/login?error=auth`);
}

/** HTML + location.replace — pops this callback entry from the back stack. */
function replaceRedirect(url: string) {
  const safe = JSON.stringify(url);
  const html = `<!DOCTYPE html><html lang="ko"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><meta http-equiv="refresh" content="0;url=${url.replace(/"/g, "")}"/><title>이동 중…</title><script>location.replace(${safe})</script></head><body></body></html>`;
  return new NextResponse(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
