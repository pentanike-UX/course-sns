import "server-only";
import type { TransportMode } from "@/lib/types";
import { cachedPath, pathCacheKey } from "../cache";
import { decodePolyline } from "../polyline";
import type { LatLngPoint, LngLat } from "../types";

/**
 * 해외 전 수단 경로 — 구글 Routes API (`computeRoutes`).
 * 타일(Maps JS)과 키를 분리: 서버는 `GOOGLE_MAPS_API_KEY` (또는 `GOOGLE_ROUTES_API_KEY`).
 *
 * POST https://routes.googleapis.com/directions/v2:computeRoutes
 * Header: `X-Goog-Api-Key`, `X-Goog-FieldMask: routes.polyline.encodedPolyline`
 *
 * travelMode: WALK | BICYCLE | DRIVE | TRANSIT
 * TRANSIT은 버스·지하철·기차를 한 모드로 받고, 필요하면 `transitPreferences.allowedTravelModes`로 좁힌다.
 *
 * 지금: 키가 있어도 **호출하지 않는다.** fetch를 채우면 해외 레그가 자동으로 탄다.
 */
export async function getGoogleLegPath(
  mode: TransportMode,
  start: LatLngPoint,
  goal: LatLngPoint,
): Promise<LngLat[] | null> {
  const travelMode = toGoogleTravelMode(mode);
  if (!travelMode) return null;

  const apiKey = process.env.GOOGLE_MAPS_API_KEY ?? process.env.GOOGLE_ROUTES_API_KEY;
  if (!apiKey) return null;

  return cachedPath(pathCacheKey(`ov:${travelMode}`, start, goal), async () => {
    // TODO(routing-overseas): POST computeRoutes with buildComputeRoutesBody(...)
    // const encoded = ...
    // const path = decodePolyline(encoded);
    // return path.length > 1 ? path : null;
    void apiKey;
    return null;
  });
}

export type GoogleTravelMode = "WALK" | "BICYCLE" | "DRIVE" | "TRANSIT";

export function toGoogleTravelMode(mode: TransportMode): GoogleTravelMode | null {
  switch (mode) {
    case "walk":
      return "WALK";
    case "bike":
      return "BICYCLE";
    case "car":
    case "taxi":
      return "DRIVE";
    case "bus":
    case "subway":
    case "train":
      return "TRANSIT";
    default:
      return null;
  }
}

export function googleTransitAllowedModes(
  mode: TransportMode,
): Array<"BUS" | "SUBWAY" | "TRAIN" | "LIGHT_RAIL" | "RAIL"> | undefined {
  if (mode === "bus") return ["BUS"];
  if (mode === "subway") return ["SUBWAY"];
  if (mode === "train") return ["TRAIN", "RAIL", "LIGHT_RAIL"];
  return undefined;
}

export function buildComputeRoutesBody(
  mode: TransportMode,
  start: LatLngPoint,
  goal: LatLngPoint,
): Record<string, unknown> | null {
  const travelMode = toGoogleTravelMode(mode);
  if (!travelMode) return null;
  const body: Record<string, unknown> = {
    origin: { location: { latLng: { latitude: start.lat, longitude: start.lng } } },
    destination: { location: { latLng: { latitude: goal.lat, longitude: goal.lng } } },
    travelMode,
    languageCode: "ko",
  };
  const allowed = googleTransitAllowedModes(mode);
  if (travelMode === "TRANSIT" && allowed) {
    body.transitPreferences = { allowedTravelModes: allowed };
  }
  return body;
}

export function parseGoogleRoutesResponse(data: unknown): LngLat[] | null {
  const encoded = (data as { routes?: Array<{ polyline?: { encodedPolyline?: string } }> })
    ?.routes?.[0]?.polyline?.encodedPolyline;
  if (!encoded) return null;
  const path = decodePolyline(encoded);
  return path.length > 1 ? path : null;
}

export const GOOGLE_COMPUTE_ROUTES_URL =
  "https://routes.googleapis.com/directions/v2:computeRoutes";
export const GOOGLE_ROUTES_FIELD_MASK = "routes.polyline.encodedPolyline";
