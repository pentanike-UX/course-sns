import AppHeader from "@/components/AppHeader";
import ProfileDrawerBody from "@/components/ProfileDrawerBody";
import {
  getMyRoutes,
  getCurrentProfile,
  getMyCollectionCounts,
  getMyDefaultVisibility,
} from "@/lib/data";
import ProfileActions from "./ProfileActions";

/**
 * Hard navigation to /profile — full-page settings (not EdgeDrawer).
 * Soft overlay from 둘러보기 still uses FeedExplorer's SlideDrawer.
 */
export default async function ProfilePage() {
  const [routes, profile, counts, defaultVisibility] = await Promise.all([
    getMyRoutes(),
    getCurrentProfile(),
    getMyCollectionCounts(),
    getMyDefaultVisibility(),
  ]);

  return (
    <>
      <AppHeader back="/" title="설정" right={<ProfileActions />} />
      <div className="no-scrollbar flex-1 overflow-y-auto pb-[calc(env(safe-area-inset-bottom)+5rem)]">
        <ProfileDrawerBody
          routes={routes}
          profile={profile}
          counts={counts}
          defaultVisibility={defaultVisibility}
        />
      </div>
    </>
  );
}
