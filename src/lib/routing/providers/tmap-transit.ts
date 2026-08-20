import "server-only";
import { cachedPath, pathCacheKey } from "../cache";
import { parseLngLatLinestring } from "../polyline";
import type { LatLngPoint, LngLat } from "../types";

/**
 * TMAP Transit — 국내 B. 버스·지하철·기차 실노선.
 * POST https://apis.openapi.sk.com/transit/routes
 *
 * 요청 본문 예:
 * `{ startX, startY, endX, endY, lang: 0, format: "json", count: 1, searchDttm: "YYYYMMDDhhmm" }`
 *
 * 응답: `metaData.plan.itineraries[0].legs[]` 의 `passShape.linestring` 또는
 * `steps[].linestring` 을 이어 붙인다. 후보는 여러 개 — MVP는 **첫 itinerary**.
 *
 * 지금: 키만 있어도 **호출하지 않는다.** 아래 fetch를 채우면 `getKoreaLegPath`가 자동으로 탄다.
 */
export async function getTmapTransitPath(
  start: LatLngPoint,
  goal: LatLngPoint,
): Promise<LngLat[] | null> {
  const appKey = process.env.TMAP_APP_KEY;
  if (!appKey) return null;

  return cachedPath(pathCacheKey("kr:transit", start, goal), async () => {
    // TODO(routing-B): POST TMAP_TRANSIT, parseTmapTransitResponse(json)
    void appKey;
    return null;
  });
}

export const TMAP_TRANSIT_URL = "https://apis.openapi.sk.com/transit/routes";

export function parseTmapTransitResponse(data: unknown): LngLat[] | null {
  const plan = (data as { metaData?: { plan?: { itineraries?: unknown[] } } })?.metaData?.plan;
  const first = plan?.itineraries?.[0] as
    | { legs?: Array<{ passShape?: { linestring?: string }; steps?: Array<{ linestring?: string }> }> }
    | undefined;
  if (!first?.legs?.length) return null;

  const path: LngLat[] = [];
  for (const leg of first.legs) {
    if (leg.passShape?.linestring) {
      path.push(...parseLngLatLinestring(leg.passShape.linestring));
    } else if (Array.isArray(leg.steps)) {
      for (const step of leg.steps) {
        if (step.linestring) path.push(...parseLngLatLinestring(step.linestring));
      }
    }
  }
  return path.length > 1 ? path : null;
}
