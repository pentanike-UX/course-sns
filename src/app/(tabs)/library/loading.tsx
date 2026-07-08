import AppHeader from "@/components/AppHeader";
import { RouteListSkeleton } from "@/components/RouteCardSkeleton";
import { SegmentedControlSkeleton } from "@/components/Skeleton";

export default function LibraryLoading() {
  return (
    <>
      <AppHeader title="보관함" large />
      <div className="px-4 pt-2">
        <SegmentedControlSkeleton />
      </div>
      <RouteListSkeleton count={2} collectionAction />
    </>
  );
}
