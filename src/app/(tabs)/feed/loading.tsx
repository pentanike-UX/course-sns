import AppHeader from "@/components/AppHeader";
import { HeaderActionSkeleton, Skeleton, SegmentedControlSkeleton } from "@/components/Skeleton";
import { HomeRoutePanelSkeleton } from "@/components/RouteCardSkeleton";

// this tab now hosts the user's own courses (내 코스)
export default function FeedLoading() {
  return (
    <>
      <AppHeader brand right={<HeaderActionSkeleton />} />
      <section className="px-4 pb-6 pt-1">
        <Skeleton className="h-4 w-36 rounded-full" />
        <Skeleton className="mt-3 h-6 w-48 rounded-full" />
        <Skeleton className="mt-2 h-6 w-36 rounded-full" />
      </section>
      <div className="px-4 pb-1">
        <SegmentedControlSkeleton segments={3} />
      </div>
      <HomeRoutePanelSkeleton count={2} />
    </>
  );
}
