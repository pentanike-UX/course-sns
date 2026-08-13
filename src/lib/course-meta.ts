import { haversineMeters } from "@/lib/geo";
import type { TransportMode } from "@/lib/types";

/** Radius for grouping geotagged photos into one spot (metres). */
export const CLUSTER_RADIUS_M = 150;

export type GeoRead = {
  file: File;
  lat?: number;
  lng?: number;
  takenAt: number;
};

export type PhotoCluster = {
  lat: number;
  lng: number;
  t: number;
  files: File[];
  firstTakenAt: number;
  lastTakenAt: number;
};

/**
 * Time-ordered greedy clusters. Visit order is preserved — do not nearest-neighbor
 * reorder a recorded course.
 */
export function clusterPhotosByGeo(
  reads: GeoRead[],
  radiusM = CLUSTER_RADIUS_M,
): { clusters: PhotoCluster[]; unlocated: File[] } {
  const geo = reads
    .filter((r) => typeof r.lat === "number" && typeof r.lng === "number")
    .sort((a, b) => a.takenAt - b.takenAt);
  const unlocated = reads.filter((r) => typeof r.lat !== "number").map((r) => r.file);

  const clusters: PhotoCluster[] = [];
  for (const r of geo) {
    const last = clusters[clusters.length - 1];
    const point = { lat: r.lat as number, lng: r.lng as number };
    if (last && haversineMeters(last, point) < radiusM) {
      last.files.push(r.file);
      last.lastTakenAt = Math.max(last.lastTakenAt, r.takenAt);
      const n = last.files.length;
      last.lat = (last.lat * (n - 1) + point.lat) / n;
      last.lng = (last.lng * (n - 1) + point.lng) / n;
    } else {
      clusters.push({
        lat: point.lat,
        lng: point.lng,
        t: r.takenAt,
        files: [r.file],
        firstTakenAt: r.takenAt,
        lastTakenAt: r.takenAt,
      });
    }
  }

  return { clusters, unlocated };
}

export function formatVisit(ms: number) {
  const d = new Date(ms);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월`;
}

export function formatPhotoClock(ms?: number) {
  if (!ms || !Number.isFinite(ms)) return "";
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** Trim administrative suffixes so "강릉시" → "강릉". */
export function shortRegionName(area?: string): string {
  if (!area) return "";
  const trimmed = area.replace(
    /(특별자치도|특별자치시|특별시|광역시|자치시|자치구|시|군|구|도)$/u,
    "",
  );
  return trimmed || area;
}

/** Top-level region from reverse-geocoded parts: "시도 시군구" if uniform, else 시/도. */
export function deriveRegion(parts: { area1?: string; area2?: string }[]): string {
  const a1s = parts.map((p) => p.area1).filter((x): x is string => !!x);
  const distinct = [...new Set(a1s)];
  if (distinct.length === 0) return "";
  if (distinct.length > 1) return distinct.join("·");
  const a1 = distinct[0];
  const a2s = [
    ...new Set(
      parts.filter((p) => p.area1 === a1).map((p) => p.area2).filter((x): x is string => !!x),
    ),
  ];
  return a2s.length === 1 ? `${a1} ${a2s[0]}` : a1;
}

function titleRegion(region: string): string {
  const last = region.split(/[·\s]/).filter(Boolean).pop() ?? region;
  return shortRegionName(last);
}

export function autoCourseTitle(input: {
  region?: string;
  bestSeason?: string;
  firstSpot?: string;
  lastSpot?: string;
}): string {
  const short = titleRegion(input.region?.trim() ?? "");
  const month = input.bestSeason?.match(/(\d+)\s*월/)?.[1];
  if (short && month) return `${short} ${month}월 코스`;
  if (short) return `${short} 코스`;
  const a = input.firstSpot?.trim();
  const b = input.lastSpot?.trim();
  if (a && b && a !== b) return `${a} → ${b}`;
  if (a) return a;
  return "나의 코스";
}

const SPEED_KMH: Record<TransportMode, number> = {
  walk: 4,
  bike: 12,
  car: 28,
  taxi: 30,
  bus: 22,
  subway: 34,
  train: 42,
  other: 18,
};

const DETOUR: Record<TransportMode, number> = {
  walk: 1.18,
  bike: 1.22,
  car: 1.36,
  taxi: 1.34,
  bus: 1.45,
  subway: 1.55,
  train: 1.5,
  other: 1.3,
};

export function estimateLegMinutes(
  from: { lat?: number; lng?: number },
  to: { lat?: number; lng?: number },
  mode: TransportMode,
): number | undefined {
  if (typeof from.lat !== "number" || typeof from.lng !== "number") return undefined;
  if (typeof to.lat !== "number" || typeof to.lng !== "number") return undefined;
  const meters = haversineMeters(
    { lat: from.lat, lng: from.lng },
    { lat: to.lat, lng: to.lng },
  );
  const minutes = ((meters / 1000) * DETOUR[mode]) / SPEED_KMH[mode] * 60;
  return Math.max(3, Math.round(minutes / 5) * 5);
}

export function inferTransport(meters: number, durationMin?: number): TransportMode {
  if (durationMin && durationMin > 0 && meters > 0) {
    const kmh = meters / 1000 / (durationMin / 60);
    if (kmh < 6) return "walk";
    if (kmh < 15) return "bike";
    if (kmh < 40) return "car";
    return "train";
  }
  if (meters < 800) return "walk";
  return "car";
}

export type LegFillSpot = {
  lat?: number;
  lng?: number;
  firstTakenAt?: number;
  lastTakenAt?: number;
  legToNext: { transport: TransportMode; durationMin: string; caution: string };
};

/** Fill empty legs from EXIF gaps, else haversine + inferred mode. */
export function fillLegsFromMetadata<T extends LegFillSpot>(spots: T[]): T[] {
  return spots.map((spot, index) => {
    const next = spots[index + 1];
    if (!next) return spot;
    if (spot.legToNext.durationMin.trim()) return spot;

    let durationMin: number | undefined;
    if (
      typeof spot.lastTakenAt === "number" &&
      typeof next.firstTakenAt === "number" &&
      next.firstTakenAt > spot.lastTakenAt
    ) {
      const gapMin = (next.firstTakenAt - spot.lastTakenAt) / 60000;
      if (gapMin >= 2 && gapMin <= 12 * 60) {
        durationMin = Math.max(3, Math.round(gapMin / 5) * 5);
      }
    }

    const meters =
      typeof spot.lat === "number" &&
      typeof spot.lng === "number" &&
      typeof next.lat === "number" &&
      typeof next.lng === "number"
        ? haversineMeters(
            { lat: spot.lat, lng: spot.lng },
            { lat: next.lat, lng: next.lng },
          )
        : undefined;

    const transport =
      meters != null ? inferTransport(meters, durationMin) : spot.legToNext.transport;
    const estimated =
      durationMin ?? estimateLegMinutes(spot, next, transport);

    return {
      ...spot,
      legToNext: {
        ...spot.legToNext,
        transport,
        durationMin: estimated ? String(estimated) : spot.legToNext.durationMin,
      },
    };
  });
}

export function inferDifficulty(totalMin: number): "easy" | "normal" | "hard" {
  if (totalMin >= 90) return "hard";
  if (totalMin >= 45) return "normal";
  return "easy";
}
