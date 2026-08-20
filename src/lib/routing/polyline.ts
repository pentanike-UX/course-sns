import type { LngLat } from "./types";

/**
 * Google encoded polyline → `[lng, lat][]`.
 * Routes API `polyline.encodedPolyline` / Directions API `overview_polyline.points`.
 */
export function decodePolyline(encoded: string, precision = 5): LngLat[] {
  const path: LngLat[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  const factor = 10 ** precision;

  while (index < encoded.length) {
    lat += nextDelta();
    lng += nextDelta();
    path.push([lng / factor, lat / factor]);
  }

  return path;

  function nextDelta(): number {
    let result = 0;
    let shift = 0;
    let byte: number;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20 && index < encoded.length);
    return result & 1 ? ~(result >> 1) : result >> 1;
  }
}

/** TMAP Transit `passShape.linestring` — `"lng,lat lng,lat ..."`. */
export function parseLngLatLinestring(linestring: string): LngLat[] {
  const path: LngLat[] = [];
  for (const pair of linestring.trim().split(/\s+/)) {
    const [lngRaw, latRaw] = pair.split(",");
    const lng = Number(lngRaw);
    const lat = Number(latRaw);
    if (Number.isFinite(lng) && Number.isFinite(lat)) path.push([lng, lat]);
  }
  return path;
}
