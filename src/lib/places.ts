import "server-only";

/**
 * Naver Local Search (검색 > 지역) — server-only keyword place search.
 *
 * Uses the developers.naver.com Search OpenAPI, which takes *separate*
 * credentials from the NCP Maps key: `NAVER_SEARCH_CLIENT_ID` /
 * `NAVER_SEARCH_CLIENT_SECRET`. Without them `searchPlaces` returns `null`
 * and the location picker simply doesn't offer keyword search — the feature
 * degrades gracefully, same as Directions.
 */

export type PlaceResult = {
  name: string;
  category: string;
  /** road address preferred, falls back to jibun address */
  address: string;
  lat: number;
  lng: number;
};

const ENDPOINT = "https://openapi.naver.com/v1/search/local.json";

export function isPlaceSearchEnabled(): boolean {
  return Boolean(
    process.env.NAVER_SEARCH_CLIENT_ID && process.env.NAVER_SEARCH_CLIENT_SECRET,
  );
}

/** Naver wraps query matches in <b> tags and escapes entities in titles. */
function cleanTitle(raw: string): string {
  return raw
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

type LocalSearchItem = {
  title?: string;
  category?: string;
  address?: string;
  roadAddress?: string;
  mapx?: string;
  mapy?: string;
};

/**
 * Search places by keyword. Returns up to 5 results (the API's max for local
 * search), or `null` when credentials are missing / the API call fails.
 */
export async function searchPlaces(query: string): Promise<PlaceResult[] | null> {
  const id = process.env.NAVER_SEARCH_CLIENT_ID;
  const secret = process.env.NAVER_SEARCH_CLIENT_SECRET;
  if (!id || !secret) return null;

  const url = `${ENDPOINT}?query=${encodeURIComponent(query)}&display=5`;

  try {
    const res = await fetch(url, {
      headers: {
        "X-Naver-Client-Id": id,
        "X-Naver-Client-Secret": secret,
      },
    });
    if (!res.ok) return null;

    const data = (await res.json()) as { items?: LocalSearchItem[] };
    if (!Array.isArray(data.items)) return null;

    const places: PlaceResult[] = [];
    for (const item of data.items) {
      // mapx/mapy are WGS84 lng/lat scaled by 1e7 (post-2023 API format)
      const lng = Number(item.mapx) / 1e7;
      const lat = Number(item.mapy) / 1e7;
      if (!item.title || !Number.isFinite(lat) || !Number.isFinite(lng)) continue;
      if (lat === 0 && lng === 0) continue;
      places.push({
        name: cleanTitle(item.title),
        category: item.category ?? "",
        address: item.roadAddress || item.address || "",
        lat,
        lng,
      });
    }
    return places;
  } catch {
    return null;
  }
}
