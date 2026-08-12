import AppHeader from "@/components/AppHeader";
import LibraryTabs, { type LibraryTab } from "./LibraryTabs";
import {
  getBookmarkedRoutes,
  getMyFollowedCourses,
  getFollowingCourseStream,
  getMyFollowing,
} from "@/lib/data";

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  // Default = 따라가는 중 (transfer). ?tab=saved | subscribed | people
  // `following` kept as alias for subscribed (FOL-02 stream deep-link).
  const active: LibraryTab =
    tab === "saved"
      ? "saved"
      : tab === "people" || tab === "subscribed" || tab === "following"
        ? "followingPeople"
        : "following";
  const subscribeMode: "courses" | "people" =
    tab === "people" ? "people" : "courses";

  const [followed, saved, followingCourses, followingPeople] = await Promise.all([
    getMyFollowedCourses(),
    getBookmarkedRoutes(),
    getFollowingCourseStream(),
    getMyFollowing(),
  ]);

  return (
    <>
      <AppHeader title="보관함" large />
      <LibraryTabs
        followed={followed}
        saved={saved}
        followingCourses={followingCourses}
        followingPeople={followingPeople}
        initialTab={active}
        initialSubscribeMode={subscribeMode}
      />
    </>
  );
}
