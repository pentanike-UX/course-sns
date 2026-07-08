import "server-only";
import type { TransportMode } from "./types";

/**
 * Server-only road/path lookup for drawing legs on real geometry.
 *
 *  - Driving (car/taxi/bus/train) → Naver Cloud Directions (driving only).
 *  - Walking/cycling → TMAP pedestrian directions when `TMAP_APP_KEY` is set,
 *    otherwise it falls back to the driving path so the line still follows roads
 *    instead of cutting through buildings.
 *  - Subway/other → no geometry (callers draw a connector).
 *
 * Every lookup degrades gracefully to `null` when credentials are missing or
 * the API fails. Callers should not draw a straight/curved connector for
 * road-routed modes; otherwise pedestrian legs can appear to cut through
 * buildings while the real geometry is unavailable.
 */

export type LngLat = [number, number];

const ROAD_MODES: ReadonlySet<TransportMode> = new Set([
  "car",
  "taxi",
  "bus",
  "train",
]);

/** Whether this mode should be snapped to real roads via driving directions. */
export function isRoadMode(mode: TransportMode): boolean {
  return ROAD_MODES.has(mode);
}

// Per-process memo so repeated detail renders don't re-hit the API for the
// same coordinate pair. `null` is cached too (failed/unsupported lookups).
const cache = new Map<string, LngLat[] | null>();

// New-key (ncpKeyId) Maps APIs are served from maps.apigw.ntruss.com. The
// legacy naveropenapi.apigw.ntruss.com host returns 210 for these credentials.
const ENDPOINT = "https://maps.apigw.ntruss.com/map-direction/v1/driving";

/**
 * Resolve the driving road geometry between two points as `[lng, lat]` pairs,
 * or `null` if directions are unavailable (no credentials, API error, no route).
 */
export async function getDrivingPath(
  start: { lat: number; lng: number },
  goal: { lat: number; lng: number },
): Promise<LngLat[] | null> {
  const keyId = process.env.NEXT_PUBLIC_NAVER_MAP_KEY;
  const secret = process.env.NAVER_MAP_CLIENT_SECRET;
  if (!keyId || !secret) return null;

  const cacheKey = `${start.lng},${start.lat}>${goal.lng},${goal.lat}`;
  const cached = cache.get(cacheKey);
  if (cached !== undefined) return cached;

  const url = `${ENDPOINT}?start=${start.lng},${start.lat}&goal=${goal.lng},${goal.lat}&option=traoptimal`;

  try {
    const res = await fetch(url, {
      headers: {
        "x-ncp-apigw-api-key-id": keyId,
        "x-ncp-apigw-api-key": secret,
      },
      // road geometry between two fixed points is stable — cache for a day
      next: { revalidate: 86400 },
    });

    if (!res.ok) {
      cache.set(cacheKey, null);
      return null;
    }

    const data = await res.json();
    // data.route is keyed by the requested option (e.g. traoptimal). Be lenient
    // and read whichever option came back first.
    const routeObj = data?.route;
    const firstOption = routeObj && Object.values(routeObj)[0];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const path = (firstOption as any)?.[0]?.path;

    const result: LngLat[] | null = Array.isArray(path)
      ? (path as LngLat[])
      : null;
    cache.set(cacheKey, result);
    return result;
  } catch {
    cache.set(cacheKey, null);
    return null;
  }
}

const TMAP_PEDESTRIAN = "https://apis.openapi.sk.com/tmap/routes/pedestrian?version=1";

/**
 * Real walking geometry between two points via TMAP's pedestrian directions
 * (the de-facto walking router in Korea), or `null` when `TMAP_APP_KEY` is
 * missing or the lookup fails. Concatenates the route's LineString segments.
 */
export async function getWalkingPath(
  start: { lat: number; lng: number },
  goal: { lat: number; lng: number },
): Promise<LngLat[] | null> {
  const appKey = process.env.TMAP_APP_KEY;
  if (!appKey) return null;

  const cacheKey = `walk:${start.lng},${start.lat}>${goal.lng},${goal.lat}`;
  const cached = cache.get(cacheKey);
  if (cached !== undefined) return cached;

  try {
    const res = await fetch(TMAP_PEDESTRIAN, {
      method: "POST",
      headers: { appKey, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        startX: start.lng,
        startY: start.lat,
        endX: goal.lng,
        endY: goal.lat,
        startName: "출발",
        endName: "도착",
        reqCoordType: "WGS84GEO",
        resCoordType: "WGS84GEO",
        searchOption: "0",
      }),
      next: { revalidate: 86400 },
    });

    if (!res.ok) {
      cache.set(cacheKey, null);
      return null;
    }

    const data = await res.json();
    const features = data?.features;
    const path: LngLat[] = [];
    if (Array.isArray(features)) {
      for (const f of features) {
        const g = f?.geometry;
        if (g?.type === "LineString" && Array.isArray(g.coordinates)) {
          for (const c of g.coordinates) {
            if (Array.isArray(c) && c.length >= 2) path.push([c[0], c[1]]);
          }
        }
      }
    }

    const result: LngLat[] | null = path.length > 1 ? path : null;
    cache.set(cacheKey, result);
    return result;
  } catch {
    cache.set(cacheKey, null);
    return null;
  }
}

/**
 * Resolve the on-roads geometry for a leg by transport mode: pedestrian for
 * walk/bike (falling back to driving so it still hugs roads), driving for
 * road modes, and none for subway/other (drawn as a connector).
 */
export async function getLegPath(
  mode: TransportMode,
  start: { lat: number; lng: number },
  goal: { lat: number; lng: number },
): Promise<LngLat[] | null> {
  if (mode === "walk" || mode === "bike") {
    return (await getWalkingPath(start, goal)) ?? (await getDrivingPath(start, goal));
  }
  if (isRoadMode(mode)) return getDrivingPath(start, goal);
  return null;
}
