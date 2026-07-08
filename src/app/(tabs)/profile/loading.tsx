import AppHeader from "@/components/AppHeader";
import { HeaderActionSkeleton, Skeleton } from "@/components/Skeleton";

export default function ProfileLoading() {
  return (
    <>
      <AppHeader title="프로필" large right={<HeaderActionSkeleton count={3} />} />
      <section className="flex flex-col items-center px-4 pb-2 pt-6">
        <Skeleton className="h-20 w-20 rounded-full bg-sunset-wash" />
        <Skeleton className="mt-3 h-5 w-28 rounded-full" />
        <Skeleton className="mt-2 h-3 w-16 rounded-full" />
        <Skeleton className="mt-4 h-8 w-24 rounded-full bg-card" />
      </section>

      <section className="mx-4 mt-4 grid grid-cols-4 divide-x divide-line rounded-[var(--radius-card)] border border-line bg-card py-4 text-center">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="mt-2 h-3 w-8 rounded-full" />
          </div>
        ))}
      </section>

      <div className="mx-4 mt-3 flex items-center justify-between rounded-[var(--radius-card)] border border-line bg-card px-4 py-3.5">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded-full bg-sunset-wash" />
          <Skeleton className="h-4 w-20 rounded-full" />
        </div>
        <Skeleton className="h-3 w-28 rounded-full" />
      </div>

      <section className="px-4 pt-6">
        <Skeleton className="h-4 w-10 rounded-full" />
        <ul className="mt-2 overflow-hidden rounded-[var(--radius-card)] border border-line bg-card">
          {Array.from({ length: 5 }).map((_, i) => (
            <li key={i} className="flex items-center justify-between border-b border-line px-4 py-3.5 last:border-0">
              <Skeleton className="h-4 w-24 rounded-full" />
              <Skeleton className={i === 0 ? "h-8 w-16 rounded-full" : "h-5 w-5 rounded-full"} />
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
