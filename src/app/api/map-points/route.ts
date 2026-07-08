import type { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/supabase/auth";
import { getFeedMapPoints } from "@/lib/data";
import { parseFilters } from "@/lib/feed-filters";

/**
 * GET /api/map-points?south&west&north&east&q&view&theme&mood&region — viewport
 * fetch for the explore map. Auth-gated like the rest of the feed.
 */
export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const sp = request.nextUrl.searchParams;
  const q = sp.get("q")?.trim().slice(0, 60) ?? "";
  const view = sp.get("view") === "following" ? ("following" as const) : ("all" as const);
  const filters = parseFilters({
    purpose: sp.get("purpose") ?? undefined,
    theme: sp.get("theme") ?? undefined,
    mood: sp.get("mood") ?? undefined,
    difficulty: sp.get("difficulty") ?? undefined,
    region: sp.get("region") ?? undefined,
  });
  const [south, west, north, east] = ["south", "west", "north", "east"].map((k) =>
    Number(sp.get(k)),
  );
  if (
    ![south, west, north, east].every(Number.isFinite) ||
    south >= north ||
    west >= east
  ) {
    return Response.json({ error: "invalid bounds" }, { status: 400 });
  }

  const points = await getFeedMapPoints({
    q,
    view,
    filters,
    bounds: { south, west, north, east },
  });
  return Response.json({ points });
}
