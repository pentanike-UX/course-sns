/**
 * localStorage / sessionStorage keys for 코스.
 * Legacy `routdiary:*` keys are still read once, then rewritten to `course:*`.
 */

export const COURSE_STORAGE = {
  feedLayout: "course:feed-layout",
  feedLayoutEvent: "course:feed-layout-change",
  feedFilters: "course:feed-filters",
  feedFiltersEvent: "course:feed-filters-change",
  feedMapCamera: "course:feed-map-camera",
  routeLayoutEvent: "course:route-layout",
  pendingRoute: "course:pending-route",
  navSeen: "course:nav-seen",
  navNavigated: "course:navigated",
  themeEvent: "course:theme",
} as const;

const LEGACY: Record<string, string> = {
  [COURSE_STORAGE.feedLayout]: "routdiary:feed-layout",
  [COURSE_STORAGE.feedFilters]: "routdiary:feed-filters",
  [COURSE_STORAGE.feedMapCamera]: "routdiary:feed-map-camera",
  [COURSE_STORAGE.pendingRoute]: "routdiary:pending-route",
  [COURSE_STORAGE.navSeen]: "routdiary:nav-seen",
  [COURSE_STORAGE.navNavigated]: "routdiary:navigated",
};

function migrateKey(store: Storage, nextKey: string) {
  try {
    if (store.getItem(nextKey) != null) return;
    const legacy = LEGACY[nextKey];
    if (!legacy) return;
    const v = store.getItem(legacy);
    if (v == null) return;
    store.setItem(nextKey, v);
    store.removeItem(legacy);
  } catch {
    /* private mode */
  }
}

export function readLocal(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    migrateKey(localStorage, key);
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeLocal(key: string, value: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

export function readSession(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    migrateKey(sessionStorage, key);
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeSession(key: string, value: string) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

export function removeSession(key: string) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(key);
    const legacy = LEGACY[key];
    if (legacy) sessionStorage.removeItem(legacy);
  } catch {
    /* ignore */
  }
}
