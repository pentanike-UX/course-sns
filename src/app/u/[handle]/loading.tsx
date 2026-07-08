import MobileFrame from "@/components/MobileFrame";
import AppHeader from "@/components/AppHeader";
import RouteCardSkeleton from "@/components/RouteCardSkeleton";
import { Skeleton, SectionHeadingSkeleton } from "@/components/Skeleton";

export default function UserProfileLoading() {
  return (
    <MobileFrame shell>
      <AppHeader back="/" title="프로필" />

      <main className="no-scrollbar min-h-0 flex-1 overflow-y-auto pb-10">
        <section className="flex flex-col items-center px-4 pb-2 pt-6">
          <Skeleton className="h-20 w-20 rounded-full bg-sunset-wash" />
          <Skeleton className="mt-3 h-5 w-28 rounded-full" />
          <Skeleton className="mt-2 h-3 w-16 rounded-full" />

          <div className="mt-4 flex items-center gap-6 text-center">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center">
                <Skeleton className="h-5 w-6 rounded-full" />
                <Skeleton className="mt-2 h-3 w-10 rounded-full" />
              </div>
            ))}
          </div>

          <Skeleton className="mt-5 h-9 w-28 rounded-full bg-card" />
        </section>

        <section className="px-4 pt-6">
          <SectionHeadingSkeleton />
          <ul className="mt-3 space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <li key={i}>
                <RouteCardSkeleton />
              </li>
            ))}
          </ul>
        </section>
      </main>
    </MobileFrame>
  );
}
