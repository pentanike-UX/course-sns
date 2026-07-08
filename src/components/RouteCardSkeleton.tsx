import { Skeleton, SectionHeadingSkeleton } from "@/components/Skeleton";

type PhotoCardProps = {
  showOwner?: boolean;
  collectionAction?: boolean;
};

/** Placeholder matching the default full-bleed RouteCard shape. */
export default function RouteCardSkeleton({
  showOwner = false,
  collectionAction = false,
}: PhotoCardProps) {
  return (
    <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-card)] bg-line">
      <Skeleton className="absolute inset-0 rounded-none" tone="line" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/62 via-black/10 to-black/22" />

      <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3.5">
        <Skeleton className="h-4 w-24 rounded-full" tone="white" />
        {collectionAction ? (
          <Skeleton className="h-9 w-9 rounded-full bg-black/35" tone="white" />
        ) : (
          <Skeleton className="h-5 w-14 rounded-full" tone="white" />
        )}
      </div>

      <div className="absolute inset-x-0 bottom-0 p-4">
        <Skeleton className="h-6 w-28 rounded-full" tone="white" />
        <Skeleton className="mt-2 h-4 w-4/5 rounded-full" tone="white" />
        <Skeleton className="mt-1.5 h-4 w-2/3 rounded-full" tone="white" />
        {showOwner && (
          <div className="mt-2 flex items-center gap-1.5">
            <Skeleton className="h-[18px] w-[18px] rounded-full" tone="white" />
            <Skeleton className="h-3 w-20 rounded-full" tone="white" />
          </div>
        )}
        <div className="mt-3 flex items-center gap-1.5">
          <Skeleton className="h-6 w-16 rounded-full" tone="white" />
          <Skeleton className="h-6 w-14 rounded-full" tone="white" />
          <Skeleton className="ml-auto h-3 w-20 rounded-full" tone="white" />
        </div>
      </div>
    </div>
  );
}

export function RouteListSkeleton({
  count = 3,
  collectionAction = false,
}: {
  count?: number;
  collectionAction?: boolean;
}) {
  return (
    <ul className="space-y-4 px-4 pb-8 pt-4">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i}>
          <RouteCardSkeleton collectionAction={collectionAction} />
        </li>
      ))}
    </ul>
  );
}

export function RouteGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <ul className="grid grid-cols-2 gap-3 px-4 pb-8 pt-4">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i}>
          <FeedGridCardSkeleton />
        </li>
      ))}
    </ul>
  );
}

export function FeedGridCardSkeleton() {
  return (
    <div className="relative aspect-[1/1.22] overflow-hidden rounded-[var(--radius-card)] bg-line shadow-[var(--shadow-sm)]">
      <Skeleton className="absolute inset-0 rounded-none" tone="line" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/20" />
      <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-2.5">
        <Skeleton className="h-6 w-20 rounded-full" tone="white" />
        <Skeleton className="h-6 w-11 rounded-full" tone="white" />
      </div>
      <div className="absolute inset-x-0 bottom-0 p-3">
        <Skeleton className="h-3 w-20 rounded-full" tone="white" />
        <Skeleton className="mt-2 h-4 w-full rounded-full" tone="white" />
        <Skeleton className="mt-1.5 h-4 w-2/3 rounded-full" tone="white" />
        <div className="mt-3 flex justify-between">
          <Skeleton className="h-3 w-12 rounded-full" tone="white" />
          <Skeleton className="h-3 w-14 rounded-full" tone="white" />
        </div>
      </div>
    </div>
  );
}

export function FeedLargeCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[var(--radius-card)] border border-line bg-card shadow-[var(--shadow-sm)]">
      <div className="relative aspect-[16/10] overflow-hidden bg-line">
        <Skeleton className="absolute inset-0 rounded-none" tone="line" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/58 via-black/10 to-black/15" />
        <div className="absolute left-3 right-3 top-3 flex justify-between gap-2">
          <Skeleton className="h-7 w-28 rounded-full" tone="white" />
          <Skeleton className="h-7 w-12 rounded-full" tone="white" />
        </div>
        <div className="absolute inset-x-0 bottom-0 p-4">
          <Skeleton className="h-3 w-24 rounded-full" tone="white" />
          <Skeleton className="mt-2 h-6 w-4/5 rounded-full" tone="white" />
          <Skeleton className="mt-1.5 h-6 w-1/2 rounded-full" tone="white" />
        </div>
      </div>
      <div className="flex items-center gap-2 px-3.5 py-3">
        <Skeleton className="h-3 w-16 rounded-full" />
        <Skeleton className="h-1 w-1 rounded-full" tone="line" />
        <Skeleton className="h-5 w-14 rounded-full" />
        <Skeleton className="h-5 w-14 rounded-full" />
        <Skeleton className="ml-auto h-3 w-16 rounded-full" />
      </div>
    </div>
  );
}

export function FeedSmallCardSkeleton() {
  return (
    <div className="flex min-h-[112px] gap-3 overflow-hidden rounded-[var(--radius-card)] border border-line bg-card p-2.5 shadow-[var(--shadow-sm)]">
      <Skeleton className="h-[92px] w-[92px] shrink-0 rounded-[calc(var(--radius-card)-2px)]" tone="line" />
      <div className="min-w-0 flex-1 py-0.5">
        <div className="flex items-center gap-1.5">
          <Skeleton className="h-[18px] w-[18px] rounded-full" />
          <Skeleton className="h-3 w-20 rounded-full" />
          <Skeleton className="ml-auto h-3 w-12 rounded-full" />
        </div>
        <Skeleton className="mt-2 h-4 w-full rounded-full" />
        <Skeleton className="mt-1.5 h-4 w-2/3 rounded-full" />
        <Skeleton className="mt-2 h-3 w-24 rounded-full" />
        <div className="mt-3 flex items-center gap-1.5">
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="ml-auto h-3 w-12 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function PlanRouteRowSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-[var(--radius-card)] border border-line bg-card p-2.5">
      <Skeleton className="h-14 w-14 shrink-0 rounded-xl bg-sunset-wash" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <Skeleton className="h-5 w-10 rounded-full" />
          <Skeleton className="h-3 w-20 rounded-full" />
        </div>
        <Skeleton className="mt-2 h-4 w-4/5 rounded-full" />
        <Skeleton className="mt-2 h-3 w-28 rounded-full" />
      </div>
      <Skeleton className="h-5 w-5 rounded-full" />
    </div>
  );
}

export function HomeRoutePanelSkeleton({ count = 2 }: { count?: number }) {
  return (
    <>
      <section className="px-4 pt-2">
        <SectionHeadingSkeleton aside />
      </section>
      <ul className="space-y-4 px-4 pb-8 pt-3">
        {Array.from({ length: count }).map((_, i) => (
          <li key={i}>
            <RouteCardSkeleton />
          </li>
        ))}
        <li>
          <div className="flex items-center justify-center gap-2 rounded-[var(--radius-card)] border-2 border-dashed border-line py-7">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-4 w-28 rounded-full" />
          </div>
        </li>
      </ul>
    </>
  );
}
