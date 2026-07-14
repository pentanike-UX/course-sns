import type { RouteSummary } from "@/lib/types";
import {
  COURSE_STORAGE,
  readSession,
  writeSession,
  removeSession,
} from "@/lib/course-storage";

export const ROUTE_ENTER_MORPH_NAME = "route-cover-enter";
export const PENDING_ROUTE_KEY = COURSE_STORAGE.pendingRoute;

const PENDING_ROUTE_TTL_MS = 8000;

export type PendingRoute = Pick<
  RouteSummary,
  | "id"
  | "author"
  | "title"
  | "region"
  | "theme"
  | "mood"
  | "coverPhotoUrl"
  | "spotCount"
  | "visibility"
  | "createdAt"
  | "copyPurpose"
  | "thumbnailPoints"
> & {
  createdAtMs: number;
};

export function writePendingRoute(route: RouteSummary) {
  if (typeof window === "undefined") return;
  const pending: PendingRoute = {
    id: route.id,
    title: route.title,
    region: route.region,
    theme: route.theme,
    mood: route.mood,
    coverPhotoUrl: route.coverPhotoUrl,
    author: route.author,
    spotCount: route.spotCount,
    visibility: route.visibility,
    createdAt: route.createdAt,
    copyPurpose: route.copyPurpose,
    thumbnailPoints: route.thumbnailPoints?.slice(0, 16),
    createdAtMs: Date.now(),
  };
  writeSession(PENDING_ROUTE_KEY, JSON.stringify(pending));
}

export function readPendingRoute(routeId?: string): PendingRoute | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = readSession(PENDING_ROUTE_KEY);
    if (!raw) return null;
    const pending = JSON.parse(raw) as PendingRoute;
    if (!pending?.id || !pending.createdAtMs) return null;
    if (routeId && pending.id !== routeId) return null;
    if (Date.now() - pending.createdAtMs > PENDING_ROUTE_TTL_MS) {
      removeSession(PENDING_ROUTE_KEY);
      return null;
    }
    return pending;
  } catch {
    return null;
  }
}

export function clearPendingRoute(routeId?: string) {
  if (typeof window === "undefined") return;
  const pending = readPendingRoute(routeId);
  if (!pending) return;
  removeSession(PENDING_ROUTE_KEY);
}
