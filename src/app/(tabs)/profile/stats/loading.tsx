import AppHeader from "@/components/AppHeader";
import { Skeleton, SectionHeadingSkeleton } from "@/components/Skeleton";

export default function TravelStatsLoading() {
  return (
    <>
      <AppHeader back="/profile" title="코스 통계" />

      <section className="mx-4 mt-4 grid grid-cols-3 divide-x divide-line rounded-[var(--radius-card)] border border-line bg-card py-4 text-center">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center">
            <Skeleton className="h-5 w-8 rounded-full" />
            <Skeleton className="mt-2 h-3 w-8 rounded-full" />
          </div>
        ))}
      </section>

      <section className="px-4 pt-6">
        <SectionHeadingSkeleton />
        <div className="mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-card)] border border-line bg-line">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-card px-4 py-3.5">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="mt-2 h-3 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 pt-6">
        <SectionHeadingSkeleton />
        <div className="mt-3 rounded-[var(--radius-card)] border border-line bg-card p-4">
          <Skeleton className="h-3 w-full rounded-full bg-sunset-wash" />
          <div className="mt-3 flex flex-wrap gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-5 w-20 rounded-full" />
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pt-6">
        <SectionHeadingSkeleton aside />
        <div className="mt-3 rounded-[var(--radius-card)] border border-line bg-card p-4">
          <div className="grid grid-flow-col grid-rows-7 gap-[3px]">
            {Array.from({ length: 26 * 7 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-[2px]" />
            ))}
          </div>
          <div className="mt-3 flex justify-end gap-1.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-2.5 w-2.5 rounded-[2px]" />
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-10 pt-6">
        <SectionHeadingSkeleton />
        <Skeleton className="mt-3 h-[260px] rounded-[var(--radius-card)]" tone="line" />
      </section>
    </>
  );
}
