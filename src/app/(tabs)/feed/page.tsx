import FeedProfileStack from "@/components/FeedProfileStack";
import ProfileDrawerBody from "@/components/ProfileDrawerBody";
import DiaryDrawerContent from "@/components/DiaryDrawerContent";
import NotificationBell from "@/components/NotificationBell";
import ProfileActions from "../profile/ProfileActions";
import {
  getMyRoutes,
  getCurrentProfile,
  getUnreadNotificationCount,
  getMyCollectionCounts,
  getMyDefaultVisibility,
} from "@/lib/data";
import type { HomeTab } from "../HomeRoutesTabs";

// 내 코스 — opened as a left drawer from the 둘러보기 header's profile chip.
// 설정 stacks the profile screen on top as a live overlay (feed stays mounted).
export default async function DiaryPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab: tabParam } = await searchParams;
  const tab: HomeTab = tabParam === "record" || tabParam === "plan" ? tabParam : "all";

  const [routes, profile, unread, counts, defaultVisibility] = await Promise.all([
    getMyRoutes(),
    getCurrentProfile(),
    getUnreadNotificationCount(),
    getMyCollectionCounts(),
    getMyDefaultVisibility(),
  ]);
  const displayName = profile?.displayName ?? "여행자";

  return (
    <FeedProfileStack
      notificationBell={<NotificationBell count={unread} />}
      profileActions={<ProfileActions />}
      profileContent={
        <ProfileDrawerBody
          routes={routes}
          profile={profile}
          counts={counts}
          defaultVisibility={defaultVisibility}
        />
      }
    >
      <DiaryDrawerContent displayName={displayName} routes={routes} initialTab={tab} />
    </FeedProfileStack>
  );
}
