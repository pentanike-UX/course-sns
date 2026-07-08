import HomeBoot from "@/components/HomeBoot";
import FeedExplorer from "./feed/FeedExplorer";
import ProfileDrawerBody from "@/components/ProfileDrawerBody";
import NotificationBell from "@/components/NotificationBell";
import ProfileActions from "./profile/ProfileActions";
import type { FeedMode, FeedSortClient } from "./feed/FeedControls";
import { parseFilters } from "@/lib/feed-filters";
import {
  getPublicFeed,
  getFeedMapPoints,
  getCurrentProfile,
  getMyRoutes,
  getUnreadNotificationCount,
  getMyCollectionCounts,
  getMyDefaultVisibility,
  type FeedSort,
} from "@/lib/data";
import type { HomeTab } from "./HomeRoutesTabs";

// The landing tab now hosts the 둘러보기 (explore) feed (public routes only —
// 팔로잉 moved to the 보관함 tab). The 지도 view is the same route with ?mode=map;
// both the list and the map data are fetched together so the two can slide
// across each other (the explore screen stays populated as the map pushes in).
export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    sort?: string;
    mode?: string;
    kind?: string;
    theme?: string;
    mood?: string;
    region?: string;
    dtab?: string;
  }>;
}) {
  const {
    q = "",
    sort: sortParam,
    mode: modeParam,
    kind,
    theme,
    mood,
    region,
    dtab,
  } = await searchParams;
  // 거리순 is a client-only sort; the DB query just uses recent order for it.
  const clientSort: FeedSortClient =
    sortParam === "popular" ? "popular" : sortParam === "distance" ? "distance" : "recent";
  const sort: FeedSort = clientSort === "popular" ? "popular" : "recent";
  const mode: FeedMode = modeParam === "map" ? "map" : "list";
  const filters = parseFilters({ kind, theme, mood, region });
  const diaryTab: HomeTab = dtab === "record" || dtab === "plan" ? dtab : "all";

  const [allRoutes, profile, allPoints, myRoutes, unread, counts, defaultVisibility] =
    await Promise.all([
      getPublicFeed({ sort, q }),
      getCurrentProfile(),
      getFeedMapPoints({ q, view: "all", filters }),
      getMyRoutes(),
      getUnreadNotificationCount(),
      getMyCollectionCounts(),
      getMyDefaultVisibility(),
    ]);

  // the explore header (a profile chip + search/settings) lives inside FeedExplorer
  return (
    <>
      <FeedExplorer
        q={q}
        sort={clientSort}
        mode={mode}
        profile={profile}
        initialFilters={filters}
        allRoutes={allRoutes}
        allPoints={allPoints}
        myRoutes={myRoutes}
        diaryTab={diaryTab}
        notificationBell={<NotificationBell count={unread} />}
        profileActions={<ProfileActions />}
        profileDrawer={
          <ProfileDrawerBody
            routes={myRoutes}
            profile={profile}
            counts={counts}
            defaultVisibility={defaultVisibility}
          />
        }
      />
      <HomeBoot />
    </>
  );
}
