/**
 * 지도 타일 공급자. 경로(폴리라인)는 `src/lib/routing` — 타일과 길을 한 SDK로 합치지 않는다.
 * 국내는 네이버 타일 유지. 해외(또는 혼합)만 구글 타일.
 */
import { inferCourseTiles } from "@/lib/routing/region";
import type { MapRegion } from "@/lib/routing/types";

export type MapTileProvider = "naver" | "google";

export function tileProviderForSpots(
  spots: ReadonlyArray<{ lat?: number; lng?: number }>,
): MapTileProvider {
  return inferCourseTiles(spots) === "overseas" ? "google" : "naver";
}

export function tileProviderForRegion(region: MapRegion): MapTileProvider {
  return region === "overseas" ? "google" : "naver";
}
