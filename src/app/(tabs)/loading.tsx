import AppHeader from "@/components/AppHeader";
import { RouteGridSkeleton } from "@/components/RouteCardSkeleton";
import {
  HeaderActionSkeleton,
  SegmentedControlSkeleton,
  Skeleton,
} from "@/components/Skeleton";

// landing tab = 둘러보기 (explore) feed
export default function HomeLoading() {
  return (
    <>
      <AppHeader title="둘러보기" large right={<HeaderActionSkeleton />} />
      <div className="px-4 pt-2">
        <div className="mb-3 flex gap-2.5">
          <SegmentedControlSkeleton className="flex-1" />
          <Skeleton className="h-10 w-20 rounded-full bg-sunset-wash" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-16 rounded-full" />
          <Skeleton className="h-8 w-16 rounded-full" />
          <Skeleton className="h-8 w-16 rounded-full" />
          <div className="ml-auto flex rounded-full bg-muted p-1">
            <Skeleton className="h-7 w-7 rounded-full bg-card" />
            <Skeleton className="h-7 w-7 rounded-full" />
            <Skeleton className="h-7 w-7 rounded-full" />
          </div>
        </div>
      </div>
      <RouteGridSkeleton count={4} />
    </>
  );
}
