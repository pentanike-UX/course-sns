import AppHeader from "@/components/AppHeader";
import LibraryTabs, { type LibraryTab } from "./LibraryTabs";
import {
  getBookmarkedRoutes,
  getLikedRoutes,
  getMyFollowing,
} from "@/lib/data";

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  // 보관함 defaults to 좋아요 (the heart nav icon); others need an explicit ?tab=.
  const active: LibraryTab =
    tab === "saved" ? "saved" : tab === "following" ? "following" : "liked";

  // fetch everything so the segment switches without a round-trip
  const [saved, liked, followingPeople] = await Promise.all([
    getBookmarkedRoutes(),
    getLikedRoutes(),
    getMyFollowing(),
  ]);

  return (
    <>
      <AppHeader title="보관함" large />
      <LibraryTabs
        saved={saved}
        liked={liked}
        followingPeople={followingPeople}
        initialTab={active}
      />
    </>
  );
}
