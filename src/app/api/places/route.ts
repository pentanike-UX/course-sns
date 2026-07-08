import type { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/supabase/auth";
import { isPlaceSearchEnabled, searchPlaces } from "@/lib/places";

/**
 * GET /api/places?q=키워드 — keyword place search proxy.
 *
 * Auth-gated: the picker is only reachable by logged-in users anyway, and the
 * Search OpenAPI has a daily quota (25k) worth protecting from anonymous use.
 */
export async function GET(request: NextRequest) {
  if (!isPlaceSearchEnabled()) {
    return Response.json({ enabled: false, places: [] });
  }

  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2 || q.length > 60) {
    return Response.json({ enabled: true, places: [] });
  }

  const user = await getAuthUser();
  if (!user) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const places = await searchPlaces(q);
  return Response.json({ enabled: true, places: places ?? [] });
}
