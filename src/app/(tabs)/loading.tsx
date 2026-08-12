import { BrandWordmark } from "@/components/BrandMark";
import GlassCircle from "@/components/GlassCircle";
import { RouteGridSkeleton } from "@/components/RouteCardSkeleton";
import { Skeleton } from "@/components/Skeleton";

/** Landing explore feed skeleton — matches FeedExplorer (no 전체/팔로잉 segment). */
export default function HomeLoading() {
  return (
    <>
      <header className="flex h-[calc(env(safe-area-inset-top)+3.5rem)] items-center gap-2 bg-paper/90 px-3 pt-[env(safe-area-inset-top)] backdrop-blur">
        <BrandWordmark markSize={38} className="pl-0.5" />
        <div className="ml-auto flex items-center gap-0">
          <span className="flex h-11 w-11 items-center justify-center">
            <GlassCircle>
              <Skeleton className="h-5 w-5 rounded-full" />
            </GlassCircle>
          </span>
          <span className="flex h-11 w-11 items-center justify-center">
            <GlassCircle>
              <Skeleton className="h-5 w-5 rounded-full" />
            </GlassCircle>
          </span>
        </div>
      </header>
      <div className="bg-paper/95 px-4 pb-2 pt-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-10 shrink-0 rounded-full" />
          <Skeleton className="h-8 w-[4.5rem] shrink-0 rounded-full" />
          <Skeleton className="h-8 w-20 shrink-0 rounded-full" />
          <Skeleton className="h-8 w-20 shrink-0 rounded-full" />
          <Skeleton className="ml-auto h-8 w-8 shrink-0 rounded-full" />
        </div>
      </div>
      <RouteGridSkeleton count={4} />
    </>
  );
}
