import type { LatLngPoint, MapRegion } from "./types";

/**
 * 남한(제주·울릉·독도 포함) 대략 bbox. 북한·중국·일본 본토는 제외.
 * 레그·타일 공급자를 가르는 유일한 지리적 기준. 코스 `region` 텍스트는 쓰지 않는다.
 */
export const KR_BOUNDS = {
  latMin: 33.0,
  latMax: 38.72,
  lngMin: 124.5,
  lngMax: 132.0,
} as const;

export function isKoreaPoint(point: LatLngPoint): boolean {
  return (
    point.lat >= KR_BOUNDS.latMin &&
    point.lat <= KR_BOUNDS.latMax &&
    point.lng >= KR_BOUNDS.lngMin &&
    point.lng <= KR_BOUNDS.lngMax
  );
}

/** 양 끝이 모두 국내일 때만 국내 스택. 하나라도 밖이면 해외(구글). */
export function inferLegRegion(start: LatLngPoint, goal: LatLngPoint): MapRegion {
  return isKoreaPoint(start) && isKoreaPoint(goal) ? "korea" : "overseas";
}

/**
 * 타일: 위치가 있는 스팟이 모두 국내 → 네이버. 그 외(해외 스팟 포함·혼합) → 구글.
 * 국내 전용 코스의 타일을 구글로 바꾸지 않기 위한 규칙.
 */
export function inferCourseTiles(
  spots: ReadonlyArray<{ lat?: number; lng?: number }>,
): MapRegion {
  const located = spots.filter(
    (s): s is { lat: number; lng: number } =>
      typeof s.lat === "number" && typeof s.lng === "number",
  );
  if (located.length === 0) return "korea";
  return located.every(isKoreaPoint) ? "korea" : "overseas";
}
