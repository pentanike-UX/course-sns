import { SegmentedControlSkeleton, Skeleton } from "@/components/Skeleton";
import { HomeRoutePanelSkeleton } from "@/components/RouteCardSkeleton";

/** Placeholder shown while the 내 일기 drawer shell slides in (deferBody). */
export default function DiaryDrawerSkeleton() {
  return (
    <>
      <section className="px-4 pb-5 pt-1" aria-hidden>
        <Skeleton className="h-4 w-36 rounded-full" />
        <Skeleton className="mt-3 h-6 w-48 rounded-full" />
        <Skeleton className="mt-2 h-6 w-36 rounded-full" />
      </section>
      <div className="px-4 pb-1" aria-hidden>
        <SegmentedControlSkeleton segments={3} />
      </div>
      <HomeRoutePanelSkeleton count={2} />
    </>
  );
}
