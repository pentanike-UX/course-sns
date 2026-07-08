import MobileFrame from "@/components/MobileFrame";
import AppHeader from "@/components/AppHeader";
import { Skeleton } from "@/components/Skeleton";

export default function ProfileEditLoading() {
  return (
    <MobileFrame>
      <AppHeader back="/profile" title="프로필 편집" right={<Skeleton className="h-8 w-16 rounded-full bg-sunset-wash" />} />

      <main className="flex-1 overflow-y-auto px-4 pb-10">
        <div className="flex flex-col items-center pt-6">
          <Skeleton className="h-24 w-24 rounded-full bg-sunset-wash" />
        </div>

        <div className="mt-8 space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <label key={i} className="block">
              <Skeleton className="mb-2 h-3 w-16 rounded-full" />
              <Skeleton className="h-11 w-full rounded-xl bg-card" />
              {i === 1 && <Skeleton className="mt-2 h-3 w-32 rounded-full" />}
            </label>
          ))}
        </div>
      </main>
    </MobileFrame>
  );
}
