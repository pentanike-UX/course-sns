import "server-only";
import { cachedPath, pathCacheKey } from "../cache";
import type { LatLngPoint, LngLat } from "../types";

/**
 * ODsay 대중교통 — 국내 C. 지하철·버스 **노선 그래픽** (`loadLane`).
 *
 * 1) GET `https://api.odsay.com/v1/api/searchPubTransPathT`
 *    `SX,SY,EX,EY,apiKey` (X=lng, Y=lat)
 * 2) 결과 `result.path[0].info.mapObj` 로
 *    GET `https://api.odsay.com/v1/api/loadLane?mapObject=...`
 * 3) `result.lane[].section[].graphPos[]` 의 `{x,y}` = lng,lat 를 이어 붙인다.
 *
 * 키: `ODSAY_API_KEY`. TMAP Transit과 **둘 중 하나**. 동시 사용 시 Transit 우선.
 */
export async function getOdsayTransitPath(
  start: LatLngPoint,
  goal: LatLngPoint,
): Promise<LngLat[] | null> {
  const apiKey = process.env.ODSAY_API_KEY;
  if (!apiKey) return null;

  return cachedPath(pathCacheKey("kr:odsay", start, goal), async () => {
    // TODO(routing-C): searchPubTransPathT → loadLane → parseOdsayLaneResponse
    void apiKey;
    return null;
  });
}

export const ODSAY_SEARCH_URL = "https://api.odsay.com/v1/api/searchPubTransPathT";
export const ODSAY_LANE_URL = "https://api.odsay.com/v1/api/loadLane";

export function parseOdsayLaneResponse(data: unknown): LngLat[] | null {
  const lanes = (data as { result?: { lane?: unknown[] } })?.result?.lane;
  if (!Array.isArray(lanes)) return null;
  const path: LngLat[] = [];
  for (const lane of lanes) {
    const sections = (lane as { section?: unknown[] })?.section;
    if (!Array.isArray(sections)) continue;
    for (const section of sections) {
      const pos = (section as { graphPos?: Array<{ x?: number; y?: number }> })?.graphPos;
      if (!Array.isArray(pos)) continue;
      for (const p of pos) {
        if (typeof p.x === "number" && typeof p.y === "number") path.push([p.x, p.y]);
      }
    }
  }
  return path.length > 1 ? path : null;
}
