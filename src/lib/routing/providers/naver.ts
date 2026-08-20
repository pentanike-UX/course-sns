import "server-only";
import { cachedPath, pathCacheKey } from "../cache";
import type { LatLngPoint, LngLat } from "../types";

const ENDPOINT = "https://maps.apigw.ntruss.com/map-direction/v1/driving";

/**
 * 네이버 Cloud Directions 5/15 — **자동차만**. 국내 자가용·택시.
 * 도보·자전거·대중교통 엔드포인트는 없다.
 */
export async function getNaverDrivingPath(
  start: LatLngPoint,
  goal: LatLngPoint,
): Promise<LngLat[] | null> {
  const keyId = process.env.NEXT_PUBLIC_NAVER_MAP_KEY;
  const secret = process.env.NAVER_MAP_CLIENT_SECRET;
  if (!keyId || !secret) return null;

  return cachedPath(pathCacheKey("kr:drive", start, goal), async () => {
    const url = `${ENDPOINT}?start=${start.lng},${start.lat}&goal=${goal.lng},${goal.lat}&option=traoptimal`;
    const res = await fetch(url, {
      headers: {
        "x-ncp-apigw-api-key-id": keyId,
        "x-ncp-apigw-api-key": secret,
      },
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;

    const data = await res.json();
    const routeObj = data?.route;
    const firstOption = routeObj && Object.values(routeObj)[0];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const path = (firstOption as any)?.[0]?.path;
    return Array.isArray(path) ? (path as LngLat[]) : null;
  });
}
