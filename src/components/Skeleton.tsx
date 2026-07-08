type SkeletonTone = "muted" | "line" | "white";

const toneClass: Record<SkeletonTone, string> = {
  muted: "bg-muted",
  line: "bg-line",
  white: "bg-white/35",
};

export function Skeleton({
  className = "",
  tone = "muted",
}: {
  className?: string;
  tone?: SkeletonTone;
}) {
  const bg = /\bbg-/.test(className) ? "" : toneClass[tone];
  return <div aria-hidden className={`animate-pulse ${bg} ${className}`} />;
}

export function HeaderActionSkeleton({ count = 1 }: { count?: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-10 rounded-full border border-line bg-card" />
      ))}
    </div>
  );
}

export function SectionHeadingSkeleton({
  aside = false,
  className = "",
}: {
  aside?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <Skeleton className="h-4 w-24 rounded-full" />
      {aside && <Skeleton className="h-3 w-12 rounded-full" />}
    </div>
  );
}

export function SegmentedControlSkeleton({
  segments = 2,
  className = "",
}: {
  segments?: number;
  className?: string;
}) {
  return (
    <div className={`flex h-10 rounded-full bg-muted p-1 ${className}`} aria-hidden>
      {Array.from({ length: segments }).map((_, i) => (
        <div key={i} className="flex-1 px-1">
          <Skeleton className="h-full rounded-full bg-card" />
        </div>
      ))}
    </div>
  );
}
