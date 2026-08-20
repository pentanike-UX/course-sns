import "server-only";

/**
 * 하위 호환. 새 코드는 `@/lib/routing` 에서 가져온다.
 * 구현 키트: `docs/routing/README.md`
 */
export {
  getLegPath,
  getKoreaLegPath,
  getDrivingPath,
  getWalkingPath,
  isRoadMode,
  inferLegRegion,
  inferCourseTiles,
} from "./routing";
export type { LngLat, LatLngPoint, MapRegion } from "./routing";
