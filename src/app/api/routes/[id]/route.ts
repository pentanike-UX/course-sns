import { getAuthUser } from "@/lib/supabase/auth";
import { getRoute } from "@/lib/data";

/**
 * GET /api/routes/[id] — full route detail as JSON, so the explore map can
 * present a route in a stacked sheet without a full navigation. Auth-gated
 * like the rest of the feed surface.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthUser();
  if (!user) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const route = await getRoute(id);
  if (!route) {
    return Response.json({ error: "not found" }, { status: 404 });
  }

  return Response.json({ route });
}
