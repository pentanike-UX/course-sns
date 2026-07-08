import MobileFrame from "@/components/MobileFrame";
import AppHeader from "@/components/AppHeader";
import { Skeleton } from "@/components/Skeleton";

export default function NotificationsLoading() {
  return (
    <MobileFrame shell>
      <AppHeader back="/" title="알림" />
      <div className="flex justify-end border-b border-line px-4 py-2">
        <Skeleton className="h-4 w-16 rounded-full" />
      </div>

      <main className="no-scrollbar min-h-0 flex-1 overflow-y-auto pb-10">
        <ul>
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i} className="flex items-center gap-3 border-b border-line px-4 py-3.5">
              <Skeleton className="h-9 w-9 shrink-0 rounded-full bg-sunset-wash" />
              <div className="min-w-0 flex-1">
                <Skeleton className="h-4 w-4/5 rounded-full" />
                <Skeleton className="mt-2 h-3 w-16 rounded-full" />
              </div>
              {i < 2 && <Skeleton className="h-2 w-2 shrink-0 rounded-full bg-sunset-wash" />}
            </li>
          ))}
        </ul>
      </main>
    </MobileFrame>
  );
}
