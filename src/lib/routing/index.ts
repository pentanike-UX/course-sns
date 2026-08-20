import "server-only";
import type { TransportMode } from "@/lib/types";
import { inferLegRegion } from "./region";
import { getNaverDrivingPath } from "./providers/naver";
import { getTmapWalkingPath } from "./providers/tmap-walk";
import { getTmapTransitPath } from "./providers/tmap-transit";
import { getOdsayTransitPath } from "./providers/odsay";
import { getGoogleLegPath } from "./providers/google";
import type { LatLngPoint, LngLat } from "./types";

export type { LngLat, LatLngPoint, MapRegion, LegPathRequest, LegPathResult } from "./types";
export { inferLegRegion, inferCourseTiles, isKoreaPoint, KR_BOUNDS } from "./region";
export { getNaverDrivingPath as getDrivingPath } from "./providers/naver";
export { getTmapWalkingPath as getWalkingPath } from "./providers/tmap-walk";

const KR_DRIVING_FALLBACK: ReadonlySet<TransportMode> = new Set([
  "car",
  "taxi",
  "bus",
  "train",
]);

/** 자가용·택시·(키 없을 때) 버스·기차가 도로 스냅 대상인지. */
export function isRoadMode(mode: TransportMode): boolean {
  return KR_DRIVING_FALLBACK.has(mode);
}

const KR_TRANSIT_MODES: ReadonlySet<TransportMode> = new Set(["bus", "subway", "train"]);

/**
 * 스팟 사이 실도로/노선 좌표. 지역으로 공급자를 가른다.
 *
 * - 국내: 도보·자전거 = TMAP 보행(없으면 네이버 driving). 자가용·택시 = 네이버 driving.
 *   버스·지하철·기차 = Transit/ODsay 스텁(없으면 버스·기차만 driving 폴백, 지하철은 커넥터).
 * - 해외: 구글 스텁. 키·fetch를 채우면 전 수단 경로. 지금은 `null`(커넥터).
 */
export async function getLegPath(
  mode: TransportMode,
  start: LatLngPoint,
  goal: LatLngPoint,
): Promise<LngLat[] | null> {
  if (inferLegRegion(start, goal) === "overseas") {
    return getGoogleLegPath(mode, start, goal);
  }
  return getKoreaLegPath(mode, start, goal);
}

export async function getKoreaLegPath(
  mode: TransportMode,
  start: LatLngPoint,
  goal: LatLngPoint,
): Promise<LngLat[] | null> {
  if (mode === "walk" || mode === "bike") {
    return (await getTmapWalkingPath(start, goal)) ?? (await getNaverDrivingPath(start, goal));
  }
  if (KR_TRANSIT_MODES.has(mode)) {
    const transit =
      (await getTmapTransitPath(start, goal)) ?? (await getOdsayTransitPath(start, goal));
    if (transit) return transit;
    if (mode === "subway") return null;
    return getNaverDrivingPath(start, goal);
  }
  if (mode === "car" || mode === "taxi") return getNaverDrivingPath(start, goal);
  return null;
}
