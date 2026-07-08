import type { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/supabase/auth";
import { searchPeople } from "@/lib/data";

/**
 * GET /api/people?q=키워드 — member typeahead for 보관함>팔로잉 친구 찾기.
 * Auth-gated; matches public profiles by display name or @handle.
 */
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2 || q.length > 60) {
    return Response.json({ people: [] });
  }

  const user = await getAuthUser();
  if (!user) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const people = await searchPeople(q);
  return Response.json({ people });
}
