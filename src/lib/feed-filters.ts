import type { RouteSummary } from "@/lib/types";

/** Explore-feed facet filters. Applied client-side over the prefetched feed and
 *  mirrored to the URL (so sort/view navigation and refresh keep them). */
export type FeedFilters = {
  /** route kind: "record" (루트일기) | "plan" (계획) */
  kinds: string[];
  /** who the course is for (recommended_for) — course-native purpose facet */
  purposes: string[];
  themes: string[];
  moods: string[];
  /** walking/movement intensity keys: "easy" | "normal" | "hard" */
  difficulties: string[];
  regions: string[];
};

export const EMPTY_FILTERS: FeedFilters = {
  kinds: [],
  purposes: [],
  themes: [],
  moods: [],
  difficulties: [],
  regions: [],
};

/** 코스 종류 facet — a route is a 계획 when its copy lineage says so, else 코스 기록. */
export const KIND_OPTIONS: { value: string; label: string }[] = [
  { value: "record", label: "코스 기록" },
  { value: "plan", label: "계획" },
];

/** human label for a kind value, for active-filter chips */
export function kindLabel(value: string): string {
  return KIND_OPTIONS.find((k) => k.value === value)?.label ?? value;
}

/**
 * 17 시/도. `region` is free text ("강원특별자치도 강릉시", "충청남도", "부산"…),
 * so each chip carries the prefixes that should match it — both the short label
 * and the official name (충남 → "충청남도", 전북 → "전라북도"/"전북특별자치도").
 * Bare 동/landmark values ("서초동") simply won't match any 시/도 chip.
 */
export const REGION_OPTIONS: { label: string; prefixes: string[] }[] = [
  { label: "서울", prefixes: ["서울"] },
  { label: "경기", prefixes: ["경기"] },
  { label: "인천", prefixes: ["인천"] },
  { label: "부산", prefixes: ["부산"] },
  { label: "대구", prefixes: ["대구"] },
  { label: "대전", prefixes: ["대전"] },
  { label: "광주", prefixes: ["광주"] },
  { label: "울산", prefixes: ["울산"] },
  { label: "세종", prefixes: ["세종"] },
  { label: "강원", prefixes: ["강원"] },
  { label: "충북", prefixes: ["충북", "충청북도"] },
  { label: "충남", prefixes: ["충남", "충청남도"] },
  { label: "전북", prefixes: ["전북", "전라북도"] },
  { label: "전남", prefixes: ["전남", "전라남도"] },
  { label: "경북", prefixes: ["경북", "경상북도"] },
  { label: "경남", prefixes: ["경남", "경상남도"] },
  { label: "제주", prefixes: ["제주"] },
];

const REGION_PREFIXES = new Map(REGION_OPTIONS.map((r) => [r.label, r.prefixes]));

export function regionMatches(region: string | undefined, label: string): boolean {
  if (!region) return false;
  return (REGION_PREFIXES.get(label) ?? []).some((p) => region.startsWith(p));
}

/** the region-string prefixes a 시/도 chip should match (for server-side ilike) */
export function regionPrefixesFor(label: string): string[] {
  return REGION_PREFIXES.get(label) ?? [];
}

/** A route passes when it matches every active facet (AND across facets, OR
 *  within one). theme is a comma-joined free string → substring; mood is a
 *  single value → exact; region → 시/도 prefix. */
export function routeMatchesFilters(route: RouteSummary, f: FeedFilters): boolean {
  // optional chaining guards against older persisted filters (pre-kinds) that a
  // returning user may still have in sessionStorage after a deploy
  if (f.kinds?.length) {
    const kind = route.copyPurpose === "plan" ? "plan" : "record";
    if (!f.kinds.includes(kind)) return false;
  }
  if (f.purposes?.length && !f.purposes.some((p) => route.recommendedFor?.includes(p)))
    return false;
  if (f.themes.length && !f.themes.some((t) => route.theme?.includes(t))) return false;
  if (f.moods.length && !(route.mood != null && f.moods.includes(route.mood))) return false;
  if (f.difficulties?.length && !(route.difficulty != null && f.difficulties.includes(route.difficulty)))
    return false;
  if (f.regions.length && !f.regions.some((label) => regionMatches(route.region, label)))
    return false;
  return true;
}

export function filterCount(f: FeedFilters): number {
  return (
    (f.kinds?.length ?? 0) +
    (f.purposes?.length ?? 0) +
    f.themes.length +
    f.moods.length +
    (f.difficulties?.length ?? 0) +
    f.regions.length
  );
}

export function parseFilters(sp: {
  kind?: string;
  purpose?: string;
  theme?: string;
  mood?: string;
  difficulty?: string;
  region?: string;
}): FeedFilters {
  const split = (s?: string) =>
    s ? s.split(",").map((x) => x.trim()).filter(Boolean) : [];
  return {
    kinds: split(sp.kind),
    purposes: split(sp.purpose),
    themes: split(sp.theme),
    moods: split(sp.mood),
    difficulties: split(sp.difficulty),
    regions: split(sp.region),
  };
}

/** Write active facets onto a URLSearchParams (empty facets are omitted). */
export function appendFilterParams(params: URLSearchParams, f: FeedFilters) {
  if (f.kinds.length) params.set("kind", f.kinds.join(","));
  if (f.purposes?.length) params.set("purpose", f.purposes.join(","));
  if (f.themes.length) params.set("theme", f.themes.join(","));
  if (f.moods.length) params.set("mood", f.moods.join(","));
  if (f.difficulties?.length) params.set("difficulty", f.difficulties.join(","));
  if (f.regions.length) params.set("region", f.regions.join(","));
}
