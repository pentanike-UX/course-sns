import EdgeDrawer from "@/components/EdgeDrawer";
import ProfileDrawerBody from "@/components/ProfileDrawerBody";
import {
  getMyRoutes,
  getCurrentProfile,
  getMyCollectionCounts,
  getMyDefaultVisibility,
} from "@/lib/data";
import ProfileActions from "./ProfileActions";

export default async function ProfilePage() {
  const [routes, profile, counts, defaultVisibility] = await Promise.all([
    getMyRoutes(),
    getCurrentProfile(),
    getMyCollectionCounts(),
    getMyDefaultVisibility(),
  ]);

  return (
    <EdgeDrawer side="right" headerRight={<ProfileActions />}>
      <ProfileDrawerBody
        routes={routes}
        profile={profile}
        counts={counts}
        defaultVisibility={defaultVisibility}
      />
    </EdgeDrawer>
  );
}
