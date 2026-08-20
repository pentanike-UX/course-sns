import "server-only";
import { cachedPath, pathCacheKey } from "../cache";
import type { LatLngPoint, LngLat } from "../types";

const TMAP_PEDESTRIAN = "https://apis.openapi.sk.com/tmap/routes/pedestrian?version=1";

/**
 * TMAP 보행자 경로. `TMAP_APP_KEY`가 있으면 국내 도보(자전거는 보행 근사)가 실보도로 그려진다.
 * 구현 완료 — 키만 넣으면 된다 (국내 A).
 */
export async function getTmapWalkingPath(
  start: LatLngPoint,
  goal: LatLngPoint,
): Promise<LngLat[] | null> {
  const appKey = process.env.TMAP_APP_KEY;
  if (!appKey) return null;

  return cachedPath(pathCacheKey("kr:walk", start, goal), async () => {
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
    if (!res.ok) return null;

    const data = await res.json();
    const path: LngLat[] = [];
    const features = data?.features;
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
    return path.length > 1 ? path : null;
  });
}
