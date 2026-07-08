import { getServerClient, getAuthUser } from "@/lib/supabase/auth";
import { haversineMeters } from "@/lib/geo";
import { regionPrefixesFor, type FeedFilters } from "@/lib/feed-filters";
import type {
  Route,
  RouteAuthor,
  RouteSummary,
  Spot,
  Leg,
  Comment,
  AppNotification,
  TransportMode,
  Visibility,
  CopyPurpose,
  RouteThumbnailPoint,
  RouteCompletion,
  ViewerCompletionState,
} from "./types";

const BUCKET = "route-photos";

/** Build a public URL for a stored object path. */
export function publicUrl(path: string): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
}

type ProfileRow = {
  id: string;
  handle: string;
  display_name: string;
  avatar_url: string | null;
};

function toAuthor(p: ProfileRow | null): RouteAuthor {
  return {
    id: p?.id ?? "",
    handle: p?.handle ?? "",
    displayName: p?.display_name ?? "여행자",
    avatarUrl: p?.avatar_url ?? undefined,
  };
}

export async function getCurrentProfile(): Promise<RouteAuthor | null> {
  const supabase = await getServerClient();
  const user = await getAuthUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("id, handle, display_name, avatar_url")
    .eq("id", user.id)
    .single();

  return data ? toAuthor(data) : toAuthor({
    id: user.id,
    handle: user.email?.split("@")[0] ?? "user",
    display_name: user.email?.split("@")[0] ?? "여행자",
    avatar_url: null,
  });
}

type RouteRowLite = {
  id: string;
  title: string;
  region: string;
  theme: string | null;
  mood: string | null;
  recommended_for: string | null;
  difficulty: string | null;
  cover_photo_url: string | null;
  visibility: Visibility;
  created_at: string;
  like_count: number;
  copy_count: number;
  completion_count: number;
  completion_rating_sum: number;
  completion_rating_count: number;
  author: ProfileRow | null;
  spots: { count: number }[];
  thumbnail_spots?: {
    title: string;
    lat: number | null;
    lng: number | null;
    order_index: number;
  }[];
  // copied_route_id is UNIQUE, so PostgREST infers one-to-one and returns an
  // object — but be lenient in case the cardinality detection ever changes
  copy_source?: { purpose: CopyPurpose } | { purpose: CopyPurpose }[] | null;
};

function completionRatingAvg(sum: number, count: number): number | undefined {
  if (count <= 0) return undefined;
  return Math.round((sum / count) * 10) / 10;
}

function toSummary(r: RouteRowLite): RouteSummary {
  const copySource = Array.isArray(r.copy_source)
    ? r.copy_source[0]
    : (r.copy_source ?? undefined);
  const thumbnailPoints: RouteThumbnailPoint[] = (r.thumbnail_spots ?? [])
    .filter((s) => typeof s.lat === "number" && typeof s.lng === "number")
    .sort((a, b) => a.order_index - b.order_index)
    .map((s) => ({
      title: s.title,
      lat: s.lat as number,
      lng: s.lng as number,
      orderIndex: s.order_index,
    }));

  return {
    id: r.id,
    author: toAuthor(r.author),
    title: r.title,
    region: r.region,
    theme: r.theme ?? undefined,
    mood: r.mood ?? undefined,
    recommendedFor: r.recommended_for ?? undefined,
    difficulty: r.difficulty ?? undefined,
    coverPhotoUrl: r.cover_photo_url ?? undefined,
    spotCount: r.spots?.[0]?.count ?? 0,
    visibility: r.visibility,
    createdAt: r.created_at,
    likeCount: r.like_count,
    copyCount: r.copy_count ?? 0,
    completionCount: r.completion_count ?? 0,
    completionRatingAvg: completionRatingAvg(
      r.completion_rating_sum ?? 0,
      r.completion_rating_count ?? 0,
    ),
    copyPurpose: copySource?.purpose,
    thumbnailPoints,
  };
}

// `spots` is embedded with an explicit FK hint: legs has FKs to both routes
// and spots, so PostgREST otherwise sees an ambiguous (junction) relationship.
const LITE_SELECT =
  "id, title, region, theme, mood, recommended_for, difficulty, cover_photo_url, visibility, created_at, like_count, copy_count, completion_count, completion_rating_sum, completion_rating_count, author:profiles!routes_author_id_fkey(id, handle, display_name, avatar_url), spots!spots_route_id_fkey(count), thumbnail_spots:spots!spots_route_id_fkey(title, lat, lng, order_index), copy_source:route_copies!route_copies_copied_route_id_fkey(purpose)";

export async function getMyRoutes(): Promise<RouteSummary[]> {
  const supabase = await getServerClient();
  const user = await getAuthUser();
  if (!user) return [];

  const { data } = await supabase
    .from("routes")
    .select(LITE_SELECT)
    .eq("author_id", user.id)
    .order("created_at", { ascending: false });

  return ((data as RouteRowLite[] | null) ?? []).map(toSummary);
}

export type FeedSort = "recent" | "popular";

export async function getPublicFeed(opts?: {
  sort?: FeedSort;
  q?: string;
}): Promise<RouteSummary[]> {
  const supabase = await getServerClient();
  const sort: FeedSort = opts?.sort === "popular" ? "popular" : "recent";
  // strip characters that would break PostgREST's or()/ilike filter syntax
  const q = (opts?.q ?? "").replace(/[%,()]/g, "").trim();

  let query = supabase.from("routes").select(LITE_SELECT).eq("visibility", "public");

  if (q) query = query.or(`title.ilike.%${q}%,region.ilike.%${q}%`);

  query =
    sort === "popular"
      ? query.order("like_count", { ascending: false }).order("created_at", { ascending: false })
      : query.order("created_at", { ascending: false });

  const { data } = await query;
  return ((data as RouteRowLite[] | null) ?? []).map(toSummary);
}

/** Public routes authored by people the current user follows. */
export async function getFollowingFeed(opts?: {
  sort?: FeedSort;
  q?: string;
}): Promise<RouteSummary[]> {
  const supabase = await getServerClient();
  const user = await getAuthUser();
  if (!user) return [];

  const { data: f } = await supabase
    .from("follows")
    .select("followee_id")
    .eq("follower_id", user.id);
  const ids = (f ?? []).map((r) => r.followee_id);
  if (ids.length === 0) return [];

  const sort: FeedSort = opts?.sort === "popular" ? "popular" : "recent";
  const q = (opts?.q ?? "").replace(/[%,()]/g, "").trim();

  let query = supabase
    .from("routes")
    .select(LITE_SELECT)
    .eq("visibility", "public")
    .in("author_id", ids);
  if (q) query = query.or(`title.ilike.%${q}%,region.ilike.%${q}%`);
  query =
    sort === "popular"
      ? query.order("like_count", { ascending: false }).order("created_at", { ascending: false })
      : query.order("created_at", { ascending: false });

  const { data } = await query;
  return ((data as RouteRowLite[] | null) ?? []).map(toSummary);
}

export type FeedMapPoint = {
  id: string;
  title: string;
  region: string;
  coverPhotoUrl?: string;
  likeCount: number;
  spotCount: number;
  lat: number;
  lng: number;
  /** ordered geocoded spot coordinates — the route's course for a map overlay */
  path: { lat: number; lng: number }[];
};

type MapPointRow = {
  id: string;
  title: string;
  region: string;
  cover_photo_url: string | null;
  like_count: number;
  spots: { lat: number | null; lng: number | null; order_index: number }[];
};

/**
 * Public routes pinned at their first geocoded spot — for the feed map view.
 * Routes whose spots all lack coordinates are skipped.
 */
export async function getFeedMapPoints(opts?: {
  q?: string;
  view?: "all" | "following";
  /** restrict to routes that have a spot inside these bounds (viewport fetch) */
  bounds?: { south: number; west: number; north: number; east: number };
  /** theme/mood/region facets — same semantics as the list filter */
  filters?: FeedFilters;
}): Promise<FeedMapPoint[]> {
  const supabase = await getServerClient();
  const san = (s: string) => s.replace(/[%,()]/g, "").trim();
  const q = san(opts?.q ?? "");

  let authorIds: string[] | null = null;
  if (opts?.view === "following") {
    const user = await getAuthUser();
    if (!user) return [];
    const { data: f } = await supabase
      .from("follows")
      .select("followee_id")
      .eq("follower_id", user.id);
    authorIds = (f ?? []).map((r) => r.followee_id);
    if (authorIds.length === 0) return [];
  }

  // bounds prefilter runs against spots directly — filtering the embed instead
  // would also truncate the returned spot list and break the course overlay
  let boundIds: string[] | null = null;
  if (opts?.bounds) {
    const b = opts.bounds;
    const { data: hits } = await supabase
      .from("spots")
      .select("route_id")
      .gte("lat", b.south)
      .lte("lat", b.north)
      .gte("lng", b.west)
      .lte("lng", b.east)
      .limit(600);
    boundIds = [...new Set((hits ?? []).map((r) => r.route_id))].slice(0, 150);
    if (boundIds.length === 0) return [];
  }

  let query = supabase
    .from("routes")
    .select(
      "id, title, region, cover_photo_url, like_count, spots!spots_route_id_fkey(lat, lng, order_index)",
    )
    .eq("visibility", "public")
    .order("created_at", { ascending: false })
    .limit(120);
  if (authorIds) query = query.in("author_id", authorIds);
  if (boundIds) query = query.in("id", boundIds);
  if (q) query = query.or(`title.ilike.%${q}%,region.ilike.%${q}%`);

  // facets: AND across facets, OR within one (theme substring, mood exact,
  // region 시/도 prefix — mirrors routeMatchesFilters on the list side)
  const f = opts?.filters;
  if (f?.themes.length)
    query = query.or(f.themes.map((t) => `theme.ilike.%${san(t)}%`).join(","));
  if (f?.moods.length)
    query = query.or(f.moods.map((m) => `mood.eq.${san(m)}`).join(","));
  if (f?.regions.length) {
    const prefixes = f.regions.flatMap((label) => regionPrefixesFor(label));
    if (prefixes.length)
      query = query.or(prefixes.map((p) => `region.ilike.${san(p)}%`).join(","));
  }
  if (f?.purposes?.length)
    query = query.or(f.purposes.map((p) => `recommended_for.ilike.%${san(p)}%`).join(","));
  if (f?.difficulties?.length)
    query = query.in("difficulty", f.difficulties.map((d) => san(d)));

  const { data } = await query;
  const points: FeedMapPoint[] = [];
  for (const r of (data as MapPointRow[] | null) ?? []) {
    const spots = (r.spots ?? []).slice().sort((a, b) => a.order_index - b.order_index);
    const path = spots
      .filter((s) => typeof s.lat === "number" && typeof s.lng === "number")
      .map((s) => ({ lat: s.lat as number, lng: s.lng as number }));
    if (path.length === 0) continue;
    points.push({
      id: r.id,
      title: r.title,
      region: r.region,
      coverPhotoUrl: r.cover_photo_url ?? undefined,
      likeCount: r.like_count,
      spotCount: spots.length,
      lat: path[0].lat,
      lng: path[0].lng,
      path,
    });
  }
  return points;
}

export type TravelStats = {
  routeCount: number;
  spotCount: number;
  photoCount: number;
  /** ISO date of the very first recorded route (null when none) */
  firstRecordAt: string | null;
  /** distinct calendar days with a record */
  recordDays: number;
  /** summed straight-line distance between consecutive located spots, meters */
  totalDistanceMeters: number;
  /** summed leg durations, minutes */
  totalDurationMin: number;
  /** movement segments grouped by transport, most-used first */
  transportMix: { transport: TransportMode; count: number }[];
  /** distinct regions with route counts, most-visited first */
  regions: { name: string; count: number }[];
  /** route themes / moods, most-used first */
  themes: { name: string; count: number }[];
  moods: { name: string; count: number }[];
  /** per-day record counts (only days with records) for the activity heatmap */
  daily: { date: string; count: number }[];
  /** total likes + copies my routes received */
  likeTotal: number;
  copiesReceived: number;
  /** all geocoded spot coordinates across my routes */
  points: { lat: number; lng: number }[];
};

export type RouteCopyStats = {
  total: number;
  planCount: number;
  recordCount: number;
  privateCount: number;
  publicCopies: (RouteSummary & {
    copyPurpose: CopyPurpose;
    copiedAt: string;
  })[];
};

type RouteCopyStatsRow = {
  copier_id: string;
  purpose: CopyPurpose;
  created_at: string;
  copied_route: RouteRowLite | null;
};

/** Copy lineage for an original route. Only returned to the original author. */
export async function getRouteCopyStats(
  originalRouteId: string,
): Promise<RouteCopyStats | null> {
  const user = await getAuthUser();
  if (!user) return null;
  const supabase = await getServerClient();

  const { data: route } = await supabase
    .from("routes")
    .select("author_id")
    .eq("id", originalRouteId)
    .maybeSingle();
  if (!route || route.author_id !== user.id) return null;

  const { data } = await supabase
    .from("route_copies")
    .select(
      `copier_id, purpose, created_at, copied_route:routes!route_copies_copied_route_id_fkey(${LITE_SELECT})`,
    )
    .eq("original_route_id", originalRouteId)
    .order("created_at", { ascending: false });

  const rows = (data as RouteCopyStatsRow[] | null) ?? [];
  const publicRows = rows.filter((r) => r.copied_route);
  const countPeople = (items: RouteCopyStatsRow[]) =>
    new Set(items.map((r) => r.copier_id)).size;
  return {
    total: countPeople(rows),
    planCount: countPeople(rows.filter((r) => r.purpose === "plan")),
    recordCount: countPeople(rows.filter((r) => r.purpose === "record")),
    privateCount: rows.length - publicRows.length,
    publicCopies: publicRows.slice(0, 6).map((r) => ({
      ...toSummary(r.copied_route as RouteRowLite),
      copyPurpose: r.purpose,
      copiedAt: r.created_at,
    })),
  };
}

export type RouteCopyContext = {
  purpose: CopyPurpose;
  copiedAt: string;
  original?: {
    id: string;
    title: string;
    region: string;
    author: RouteAuthor;
  };
};

type RouteCopyContextRow = {
  purpose: CopyPurpose;
  created_at: string;
  original_route: {
    id: string;
    title: string;
    region: string;
    author: ProfileRow | null;
  } | null;
};

/** Context banner for a route that was created via "이 루트 따라가기". */
export async function getRouteCopyContext(
  copiedRouteId: string,
): Promise<RouteCopyContext | null> {
  const user = await getAuthUser();
  if (!user) return null;
  const supabase = await getServerClient();

  const { data } = await supabase
    .from("route_copies")
    .select(
      "purpose, created_at, original_route:routes!route_copies_original_route_id_fkey(id, title, region, author:profiles!routes_author_id_fkey(id, handle, display_name, avatar_url))",
    )
    .eq("copied_route_id", copiedRouteId)
    .eq("copier_id", user.id)
    .maybeSingle();
  if (!data) return null;

  const row = data as RouteCopyContextRow;
  return {
    purpose: row.purpose,
    copiedAt: row.created_at,
    original: row.original_route
      ? {
          id: row.original_route.id,
          title: row.original_route.title,
          region: row.original_route.region,
          author: toAuthor(row.original_route.author),
        }
      : undefined,
  };
}

type CompletionRow = {
  id: string;
  rating: number | null;
  tip: string | null;
  created_at: string;
  completer: ProfileRow | null;
};

/** Public completion reviews for a course (visible to anyone who can read the route). */
export async function getRouteCompletions(originalRouteId: string): Promise<RouteCompletion[]> {
  const supabase = await getServerClient();
  const { data } = await supabase
    .from("route_completions")
    .select(
      "id, rating, tip, created_at, completer:profiles!route_completions_completer_id_fkey(id, handle, display_name, avatar_url)",
    )
    .eq("original_route_id", originalRouteId)
    .order("created_at", { ascending: false })
    .limit(20);

  return ((data as CompletionRow[] | null) ?? []).map((c) => ({
    id: c.id,
    rating: c.rating ?? undefined,
    tip: c.tip ?? undefined,
    createdAt: c.created_at,
    completer: toAuthor(c.completer),
  }));
}

/** Whether the viewer copied this course and has already left a completion. */
export async function getViewerCompletionState(
  originalRouteId: string,
): Promise<ViewerCompletionState | null> {
  const user = await getAuthUser();
  if (!user) return null;
  const supabase = await getServerClient();

  const [{ data: copy }, { data: completion }] = await Promise.all([
    supabase
      .from("route_copies")
      .select("id")
      .eq("original_route_id", originalRouteId)
      .eq("copier_id", user.id)
      .maybeSingle(),
    supabase
      .from("route_completions")
      .select("id, rating, tip")
      .eq("original_route_id", originalRouteId)
      .eq("completer_id", user.id)
      .maybeSingle(),
  ]);

  if (!copy) return { hasCopied: false };

  return {
    hasCopied: true,
    routeCopyId: copy.id,
    completion: completion
      ? {
          id: completion.id,
          rating: completion.rating ?? undefined,
          tip: completion.tip ?? undefined,
        }
      : undefined,
  };
}

/** Aggregates for the profile 여행 통계 page. Null when not logged in. */
export async function getMyTravelStats(): Promise<TravelStats | null> {
  const user = await getAuthUser();
  if (!user) return null;
  const supabase = await getServerClient();

  const { data } = await supabase
    .from("routes")
    .select(
      "id, region, theme, mood, created_at, like_count, spots!spots_route_id_fkey(lat, lng, order_index, spot_photos(id)), legs!legs_route_id_fkey(transport, duration_min)",
    )
    .eq("author_id", user.id);

  type StatsRow = {
    id: string;
    region: string | null;
    theme: string | null;
    mood: string | null;
    created_at: string;
    like_count: number | null;
    spots: { lat: number | null; lng: number | null; order_index: number; spot_photos: unknown[] }[];
    legs: { transport: string; duration_min: number | null }[];
  };
  const rows = (data as StatsRow[] | null) ?? [];

  const regionCount = new Map<string, number>();
  const themeCount = new Map<string, number>();
  const moodCount = new Map<string, number>();
  const transportCount = new Map<string, number>();
  const dayCount = new Map<string, number>();
  const points: { lat: number; lng: number }[] = [];
  let spotCount = 0;
  let photoCount = 0;
  let totalDistanceMeters = 0;
  let totalDurationMin = 0;
  let likeTotal = 0;
  let firstRecordAt: string | null = null;

  const bump = (m: Map<string, number>, key?: string | null) => {
    const k = key?.trim();
    if (k) m.set(k, (m.get(k) ?? 0) + 1);
  };

  for (const r of rows) {
    bump(regionCount, r.region);
    bump(themeCount, r.theme);
    bump(moodCount, r.mood);
    likeTotal += r.like_count ?? 0;
    if (!firstRecordAt || r.created_at < firstRecordAt) firstRecordAt = r.created_at;
    const day = r.created_at.slice(0, 10); // YYYY-MM-DD
    dayCount.set(day, (dayCount.get(day) ?? 0) + 1);

    const located: { lat: number; lng: number; order: number }[] = [];
    for (const s of r.spots ?? []) {
      spotCount += 1;
      photoCount += s.spot_photos?.length ?? 0;
      if (typeof s.lat === "number" && typeof s.lng === "number") {
        points.push({ lat: s.lat, lng: s.lng });
        located.push({ lat: s.lat, lng: s.lng, order: s.order_index });
      }
    }
    located.sort((a, b) => a.order - b.order);
    for (let i = 0; i < located.length - 1; i++) {
      totalDistanceMeters += haversineMeters(located[i], located[i + 1]);
    }

    for (const l of r.legs ?? []) {
      transportCount.set(l.transport, (transportCount.get(l.transport) ?? 0) + 1);
      totalDurationMin += l.duration_min ?? 0;
    }
  }

  // copies my routes received (reactions)
  let copiesReceived = 0;
  if (rows.length) {
    const { count } = await supabase
      .from("route_copies")
      .select("id", { count: "exact", head: true })
      .in(
        "original_route_id",
        rows.map((r) => r.id),
      );
    copiesReceived = count ?? 0;
  }

  const ranked = (m: Map<string, number>) =>
    [...m.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);

  return {
    routeCount: rows.length,
    spotCount,
    photoCount,
    firstRecordAt,
    recordDays: dayCount.size,
    totalDistanceMeters: Math.round(totalDistanceMeters),
    totalDurationMin,
    transportMix: [...transportCount.entries()]
      .map(([transport, count]) => ({ transport: transport as TransportMode, count }))
      .sort((a, b) => b.count - a.count),
    regions: ranked(regionCount),
    themes: ranked(themeCount),
    moods: ranked(moodCount),
    daily: [...dayCount.entries()].map(([date, count]) => ({ date, count })),
    likeTotal,
    copiesReceived,
    points,
  };
}

/** Routes the current user has bookmarked (saved), most-recent first. */
export async function getBookmarkedRoutes(): Promise<RouteSummary[]> {
  return collectedRoutes("bookmarks");
}

/** Routes the current user has liked, most-recent first. */
export async function getLikedRoutes(): Promise<RouteSummary[]> {
  return collectedRoutes("likes");
}

export type UserProfile = {
  id: string;
  handle: string;
  displayName: string;
  avatarUrl?: string;
  routes: RouteSummary[];
  followerCount: number;
  followingCount: number;
  /** sum of copy_count across this creator's public courses */
  totalCopyCount: number;
  /** sum of completion_count across this creator's public courses */
  totalCompletionCount: number;
  /** whether the current viewer follows this profile */
  isFollowing: boolean;
  /** whether this profile follows the current viewer back */
  followsMe: boolean;
  isMe: boolean;
};

/** A person in a follow list (followers/following) with the viewer's relation. */
export type PersonSummary = {
  id: string;
  handle: string;
  displayName: string;
  avatarUrl?: string;
  /** whether the current viewer follows this person */
  isFollowing: boolean;
  /** this row is the current viewer */
  isMe: boolean;
};

/** Public profile for a handle: their public routes + follow state/counts. */
export async function getUserProfile(handle: string): Promise<UserProfile | null> {
  const supabase = await getServerClient();
  const { data: prof } = await supabase
    .from("profiles")
    .select("id, handle, display_name, avatar_url")
    .eq("handle", handle)
    .maybeSingle();
  if (!prof) return null;

  const user = await getAuthUser();

  const [routesRes, followers, following, mine, theirs] = await Promise.all([
    supabase
      .from("routes")
      .select(LITE_SELECT)
      .eq("author_id", prof.id)
      .eq("visibility", "public")
      .order("created_at", { ascending: false }),
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("followee_id", prof.id),
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", prof.id),
    user
      ? supabase
          .from("follows")
          .select("follower_id")
          .eq("follower_id", user.id)
          .eq("followee_id", prof.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    user
      ? supabase
          .from("follows")
          .select("follower_id")
          .eq("follower_id", prof.id)
          .eq("followee_id", user.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return {
    id: prof.id,
    handle: prof.handle,
    displayName: prof.display_name,
    avatarUrl: prof.avatar_url ?? undefined,
    routes: ((routesRes.data as RouteRowLite[] | null) ?? []).map(toSummary),
    followerCount: followers.count ?? 0,
    followingCount: following.count ?? 0,
    totalCopyCount: ((routesRes.data as RouteRowLite[] | null) ?? []).reduce(
      (sum, r) => sum + (r.copy_count ?? 0),
      0,
    ),
    totalCompletionCount: ((routesRes.data as RouteRowLite[] | null) ?? []).reduce(
      (sum, r) => sum + (r.completion_count ?? 0),
      0,
    ),
    isFollowing: !!mine.data,
    followsMe: !!theirs.data,
    isMe: user?.id === prof.id,
  };
}

export type FollowConnections = {
  owner: { handle: string; displayName: string };
  people: PersonSummary[];
};

/**
 * The followers (people who follow `handle`) or following (people `handle`
 * follows) for a profile, newest relationship first, each annotated with
 * whether the current viewer already follows them.
 */
export async function getFollowConnections(
  handle: string,
  kind: "followers" | "following",
): Promise<FollowConnections | null> {
  const supabase = await getServerClient();
  const { data: prof } = await supabase
    .from("profiles")
    .select("id, handle, display_name")
    .eq("handle", handle)
    .maybeSingle();
  if (!prof) return null;

  const owner = { handle: prof.handle, displayName: prof.display_name };

  // followers → match rows by followee_id, keep the follower_id; following → the inverse
  const matchCol = kind === "followers" ? "followee_id" : "follower_id";
  const { data: rows } = await supabase
    .from("follows")
    .select("follower_id, followee_id, created_at")
    .eq(matchCol, prof.id)
    .order("created_at", { ascending: false });

  const ids = (rows ?? []).map((r) =>
    kind === "followers" ? r.follower_id : r.followee_id,
  );
  if (ids.length === 0) return { owner, people: [] };

  const people = await hydratePeople(supabase, ids);
  return { owner, people };
}

/** People the current user follows (for managing follows in 보관함). */
export async function getMyFollowing(): Promise<PersonSummary[]> {
  const supabase = await getServerClient();
  const user = await getAuthUser();
  if (!user) return [];

  const { data: rows } = await supabase
    .from("follows")
    .select("followee_id, created_at")
    .eq("follower_id", user.id)
    .order("created_at", { ascending: false });
  const ids = (rows ?? []).map((r) => r.followee_id);
  if (ids.length === 0) return [];

  return hydratePeople(supabase, ids);
}

/**
 * Typeahead search over public profiles by display name or @handle, excluding
 * the viewer, newest-irrelevant (name-ordered). Each row carries the viewer's
 * follow state so a follow button can render inline.
 */
export async function searchPeople(q: string): Promise<PersonSummary[]> {
  // strip characters that would break PostgREST's or()/ilike filter syntax
  const term = (q ?? "").replace(/[%,()]/g, "").trim();
  if (term.length < 2) return [];

  const supabase = await getServerClient();
  const user = await getAuthUser();

  let query = supabase
    .from("profiles")
    .select("id")
    .or(`display_name.ilike.%${term}%,handle.ilike.%${term}%`)
    .order("display_name", { ascending: true })
    .limit(20);
  if (user) query = query.neq("id", user.id);

  const { data } = await query;
  const ids = (data ?? []).map((p) => p.id);
  if (ids.length === 0) return [];

  return hydratePeople(supabase, ids);
}

/** Resolve profile rows for `ids` (preserving order) + the viewer's follow state. */
async function hydratePeople(
  supabase: Awaited<ReturnType<typeof getServerClient>>,
  ids: string[],
): Promise<PersonSummary[]> {
  const user = await getAuthUser();
  const [{ data: profs }, mine] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, handle, display_name, avatar_url")
      .in("id", ids),
    user
      ? supabase
          .from("follows")
          .select("followee_id")
          .eq("follower_id", user.id)
          .in("followee_id", ids)
      : Promise.resolve({ data: [] as { followee_id: string }[] }),
  ]);

  const followingIds = new Set((mine.data ?? []).map((r) => r.followee_id));
  const byId = new Map((profs ?? []).map((p) => [p.id, p]));

  return ids
    .map((id) => byId.get(id))
    .filter((p): p is NonNullable<typeof p> => !!p)
    .map((p) => ({
      id: p.id,
      handle: p.handle,
      displayName: p.display_name,
      avatarUrl: p.avatar_url ?? undefined,
      isFollowing: followingIds.has(p.id),
      isMe: user?.id === p.id,
    }));
}

/** The current user's notifications (newest first). */
export async function getNotifications(): Promise<AppNotification[]> {
  const supabase = await getServerClient();
  const user = await getAuthUser();
  if (!user) return [];

  const { data } = await supabase
    .from("notifications")
    .select(
      "id, type, read, created_at, route_id, actor:profiles!notifications_actor_id_fkey(id, handle, display_name, avatar_url), route:routes!notifications_route_id_fkey(title)",
    )
    .eq("recipient_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data as any[]) ?? []).map((n) => ({
    id: n.id,
    type: n.type,
    read: n.read,
    createdAt: n.created_at,
    actor: toAuthor(n.actor),
    routeId: n.route_id ?? undefined,
    routeTitle: n.route?.title ?? undefined,
  }));
}

/** Unread notification count for the bell badge. */
export async function getUnreadNotificationCount(): Promise<number> {
  const supabase = await getServerClient();
  const user = await getAuthUser();
  if (!user) return 0;
  const { count } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("recipient_id", user.id)
    .eq("read", false);
  return count ?? 0;
}

/** The current user's default visibility for new courses (course-first: public). */
export async function getMyDefaultVisibility(): Promise<Visibility> {
  const supabase = await getServerClient();
  const user = await getAuthUser();
  if (!user) return "public";
  const { data } = await supabase
    .from("profiles")
    .select("default_visibility")
    .eq("id", user.id)
    .maybeSingle();
  return (data?.default_visibility as Visibility) ?? "public";
}

/** Count of the current user's saved + liked routes (cheap head queries). */
export async function getMyCollectionCounts(): Promise<{ saved: number; liked: number }> {
  const supabase = await getServerClient();
  const user = await getAuthUser();
  if (!user) return { saved: 0, liked: 0 };

  const [bm, lk] = await Promise.all([
    supabase.from("bookmarks").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("likes").select("*", { count: "exact", head: true }).eq("user_id", user.id),
  ]);
  return { saved: bm.count ?? 0, liked: lk.count ?? 0 };
}

async function collectedRoutes(
  table: "bookmarks" | "likes",
): Promise<RouteSummary[]> {
  const supabase = await getServerClient();
  const user = await getAuthUser();
  if (!user) return [];

  const { data } = await supabase
    .from(table)
    .select(`created_at, route:routes(${LITE_SELECT})`)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return ((data as { route: RouteRowLite | null }[] | null) ?? [])
    .map((r) => r.route)
    .filter((r): r is RouteRowLite => !!r)
    .map(toSummary);
}

export type RouteMeta = {
  title: string;
  region: string;
  theme?: string;
  mood?: string;
  coverPhotoUrl?: string;
};

/** Lightweight fetch for social/OG metadata (RLS still applies → null if private to a crawler). */
export async function getRouteMeta(id: string): Promise<RouteMeta | null> {
  const supabase = await getServerClient();
  const { data } = await supabase
    .from("routes")
    .select("title, region, theme, mood, cover_photo_url")
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  return {
    title: data.title,
    region: data.region,
    theme: data.theme ?? undefined,
    mood: data.mood ?? undefined,
    coverPhotoUrl: data.cover_photo_url ?? undefined,
  };
}

export async function getRoute(id: string): Promise<Route | null> {
  const supabase = await getServerClient();
  const { data } = await supabase
    .from("routes")
    .select(
      "*, author:profiles!routes_author_id_fkey(id, handle, display_name, avatar_url), spots!spots_route_id_fkey(*, spot_photos(*)), legs!legs_route_id_fkey(*)",
    )
    .eq("id", id)
    .single();

  if (!data) return null;

  // current user's like/bookmark state for this route
  const user = await getAuthUser();
  let liked = false;
  let bookmarked = false;
  if (user) {
    const [{ data: l }, { data: b }] = await Promise.all([
      supabase.from("likes").select("route_id").eq("user_id", user.id).eq("route_id", id).maybeSingle(),
      supabase.from("bookmarks").select("route_id").eq("user_id", user.id).eq("route_id", id).maybeSingle(),
    ]);
    liked = !!l;
    bookmarked = !!b;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r = data as any;

  const spots: Spot[] = (r.spots ?? [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .sort((a: any, b: any) => a.order_index - b.order_index)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((s: any) => ({
      id: s.id,
      orderIndex: s.order_index,
      title: s.title,
      body: s.body,
      address: s.address,
      lat: s.lat ?? undefined,
      lng: s.lng ?? undefined,
      photos: (s.spot_photos ?? [])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .sort((a: any, b: any) => a.order_index - b.order_index)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((p: any) => ({
          id: p.id,
          url: publicUrl(p.storage_path),
          storagePath: p.storage_path,
          orderIndex: p.order_index,
          alt: p.alt ?? undefined,
        })),
    }));

  const legs: Leg[] = (r.legs ?? []).map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (l: any) => ({
      id: l.id,
      fromSpotId: l.from_spot_id,
      toSpotId: l.to_spot_id,
      transport: l.transport as TransportMode,
      durationMin: l.duration_min ?? undefined,
      caution: l.caution ?? undefined,
    }),
  );

  return {
    id: r.id,
    author: toAuthor(r.author),
    title: r.title,
    region: r.region,
    theme: r.theme ?? undefined,
    mood: r.mood ?? undefined,
    recommendedFor: r.recommended_for ?? undefined,
    bestSeason: r.best_season ?? undefined,
    difficulty: r.difficulty ?? undefined,
    estCostKrw: r.est_cost_krw ?? undefined,
    visibility: r.visibility,
    coverPhotoUrl: r.cover_photo_url ?? undefined,
    spots,
    legs,
    createdAt: r.created_at,
    likeCount: r.like_count,
    bookmarkCount: r.bookmark_count,
    commentCount: r.comment_count ?? 0,
    copyCount: r.copy_count ?? 0,
    completionCount: r.completion_count ?? 0,
    completionRatingAvg: completionRatingAvg(
      r.completion_rating_sum ?? 0,
      r.completion_rating_count ?? 0,
    ),
    liked,
    bookmarked,
  };
}

/** Comments on a route, oldest first, with author info. */
export async function getComments(routeId: string): Promise<Comment[]> {
  const supabase = await getServerClient();
  const { data } = await supabase
    .from("comments")
    .select("id, body, created_at, author:profiles!comments_author_id_fkey(id, handle, display_name, avatar_url)")
    .eq("route_id", routeId)
    .order("created_at", { ascending: true });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data as any[]) ?? []).map((c) => ({
    id: c.id,
    body: c.body,
    createdAt: c.created_at,
    author: toAuthor(c.author),
  }));
}
