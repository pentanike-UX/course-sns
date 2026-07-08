import type { RouteSummary } from "@/lib/types";

/** Warm the browser image cache for the first few route covers (idle-time). */
export function preloadRouteCovers(routes: RouteSummary[], limit = 3) {
  if (typeof window === "undefined") return;
  for (const route of routes.slice(0, limit)) {
    const url = route.coverPhotoUrl;
    if (!url) continue;
    const img = new Image();
    img.decoding = "async";
    img.src = url;
  }
}
