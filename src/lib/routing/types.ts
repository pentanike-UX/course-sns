import type { TransportMode } from "@/lib/types";

/** `[lng, lat]` — Naver / TMAP / 기존 `RouteMap` 폴리라인과 동일. */
export type LngLat = [number, number];

export type LatLngPoint = { lat: number; lng: number };

/** 레그 양 끝 좌표로 가른다. 코스 `region` 문자열에 의존하지 않는다. */
export type MapRegion = "korea" | "overseas";

export type LegPathRequest = {
  mode: TransportMode;
  start: LatLngPoint;
  goal: LatLngPoint;
};

/** 좌표 2개 미만이면 호출측이 커넥터(점선)를 그린다. */
export type LegPathResult = LngLat[] | null;
