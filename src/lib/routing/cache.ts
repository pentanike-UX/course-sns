import type { LngLat } from "./types";

const cache = new Map<string, LngLat[] | null>();

/** 프로세스 메모리. 실패(`null`)도 캐시해 반복 호출을 막는다. */
export async function cachedPath(
  key: string,
  compute: () => Promise<LngLat[] | null>,
): Promise<LngLat[] | null> {
  const hit = cache.get(key);
  if (hit !== undefined) return hit;
  try {
    const result = await compute();
    cache.set(key, result);
    return result;
  } catch {
    cache.set(key, null);
    return null;
  }
}

export function pathCacheKey(
  prefix: string,
  start: { lat: number; lng: number },
  goal: { lat: number; lng: number },
): string {
  return `${prefix}:${start.lng},${start.lat}>${goal.lng},${goal.lat}`;
}
