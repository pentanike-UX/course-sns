import MobileFrame from "@/components/MobileFrame";
import AppHeader from "@/components/AppHeader";
import { Skeleton } from "@/components/Skeleton";

export default function RouteFormLoadingShell({
  mode,
  back,
}: {
  mode: "create" | "edit";
  back: string;
}) {
  const isEdit = mode === "edit";

  return (
    <MobileFrame shell>
      <AppHeader
        back={back}
        closeButton
        title={isEdit ? "루트 수정" : "새 루트 기록"}
        right={isEdit ? <Skeleton className="h-8 w-16 rounded-full bg-sunset-wash" /> : undefined}
      />

      {!isEdit && (
        <div className="flex items-center gap-2 border-b border-line px-4 py-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className={`h-2 flex-1 rounded-full ${i === 0 ? "bg-sunset-wash" : ""}`} />
          ))}
        </div>
      )}

      {isEdit && (
        <nav className="no-scrollbar sticky top-0 z-20 flex gap-2 overflow-x-auto border-b border-line bg-paper/95 px-4 py-2 backdrop-blur">
          {["장소", "이동", "이야기", "공개"].map((label, i) => (
            <Skeleton key={label} className={`h-8 w-16 shrink-0 rounded-full ${i === 0 ? "bg-sunset-wash" : ""}`} />
          ))}
        </nav>
      )}

      <main className="no-scrollbar flex-1 overflow-y-auto px-4 pb-28">
        <section className="pt-6">
          <Skeleton className="h-6 w-56 rounded-full" />
          <Skeleton className="mt-2 h-4 w-full rounded-full" />
          <Skeleton className="mt-1.5 h-4 w-4/5 rounded-full" />
        </section>

        <section className="mt-6 space-y-4">
          <FormFieldSkeleton />
          <FormFieldSkeleton />
          <div className="rounded-[var(--radius-card)] border border-line bg-card p-4">
            <Skeleton className="h-4 w-24 rounded-full" />
            <div className="mt-3 space-y-2.5">
              {Array.from({ length: 3 }).map((_, i) => (
                <SpotRowSkeleton key={i} />
              ))}
            </div>
          </div>
        </section>

        <section className="mt-9 border-t border-line pt-6">
          <Skeleton className="h-5 w-36 rounded-full" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="rounded-[var(--radius-card)] border border-line bg-card p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full bg-sunset-wash" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 rounded-full" />
                    <Skeleton className="mt-2 h-3 w-24 rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </MobileFrame>
  );
}

function FormFieldSkeleton() {
  return (
    <label className="block">
      <Skeleton className="mb-2 h-3 w-16 rounded-full" />
      <Skeleton className="h-11 w-full rounded-xl bg-card" />
    </label>
  );
}

function SpotRowSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-muted/70 p-3">
      <Skeleton className="h-10 w-10 rounded-xl bg-card" />
      <div className="min-w-0 flex-1">
        <Skeleton className="h-4 w-3/4 rounded-full" />
        <Skeleton className="mt-2 h-3 w-1/2 rounded-full" />
      </div>
      <Skeleton className="h-5 w-5 rounded-full" />
    </div>
  );
}
