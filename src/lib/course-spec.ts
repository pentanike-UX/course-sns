import type { TransportMode } from "@/lib/types";
import { haversineMeters } from "@/lib/geo";
import { formatDuration } from "@/lib/format";
import { formatDistance } from "@/lib/geo";
import { difficultyByKey } from "@/lib/meta-options";

/** One-line "how do I get around this course?" label from transport modes. */
export function summarizeTransit(
  transports: Array<TransportMode | string | undefined | null>,
): string | null {
  const modes = new Set(
    transports.filter((t): t is string => typeof t === "string" && t.length > 0),
  );
  if (!modes.size) return null;
  if (modes.has("car") || modes.has("taxi")) return "차량 이동";
  if ([...modes].every((m) => m === "walk")) return "도보 코스";
  if (modes.has("bike")) return "자전거 포함";
  return "뚜벅이 가능";
}

export function sumPathDistanceMeters(
  points: Array<{ lat: number; lng: number }>,
): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += haversineMeters(points[i - 1], points[i]);
  }
  return total;
}

/** Compact "실행 스펙" chips for feed cards — time · distance · transit · difficulty. */
export function courseSpecParts(input: {
  durationMin?: number;
  distanceMeters?: number;
  transitLabel?: string | null;
  difficulty?: string;
}): string[] {
  const parts: string[] = [];
  if (input.durationMin && input.durationMin > 0) {
    parts.push(formatDuration(input.durationMin));
  }
  if (input.distanceMeters && input.distanceMeters > 0) {
    parts.push(formatDistance(input.distanceMeters));
  }
  if (input.transitLabel) parts.push(input.transitLabel);
  const diff = difficultyByKey(input.difficulty);
  if (diff) parts.push(diff.label);
  return parts;
}
