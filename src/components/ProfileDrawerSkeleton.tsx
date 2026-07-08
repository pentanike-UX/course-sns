import { Skeleton } from "@/components/Skeleton";

/** Placeholder shown while the 프로필 drawer shell slides in (deferBody). */
export default function ProfileDrawerSkeleton() {
  return (
    <>
      <section className="flex flex-col items-center px-4 pb-2 pt-6" aria-hidden>
        <Skeleton className="h-20 w-20 rounded-full" />
        <Skeleton className="mt-3 h-5 w-28 rounded-full" />
        <Skeleton className="mt-2 h-4 w-20 rounded-full" />
        <Skeleton className="mt-3 h-8 w-24 rounded-full" />
      </section>

      <section
        className="mx-4 mt-4 grid grid-cols-4 divide-x divide-line rounded-[var(--radius-card)] border border-line bg-card py-4"
        aria-hidden
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5 px-1">
            <Skeleton className="h-5 w-6 rounded-full" />
            <Skeleton className="h-3 w-8 rounded-full" />
          </div>
        ))}
      </section>

      <Skeleton className="mx-4 mt-3 h-[52px] rounded-[var(--radius-card)]" />

      <section className="px-4 pt-6" aria-hidden>
        <Skeleton className="h-4 w-12 rounded-full" />
        <ul className="mt-2 overflow-hidden rounded-[var(--radius-card)] border border-line bg-card">
          {Array.from({ length: 5 }).map((_, i) => (
            <li key={i} className="flex items-center justify-between border-b border-line px-4 py-3.5 last:border-0">
              <Skeleton className="h-4 w-24 rounded-full" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
