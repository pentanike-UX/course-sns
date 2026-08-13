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
  // WAVE-G D5: 기록 생성 스켈레톤은 4점 스텝 + 큰 올리기 화면.

  return (
    <MobileFrame shell>
      <AppHeader
        back={back}
        closeButton
        title={isEdit ? "코스 수정" : "새 코스"}
        right={isEdit ? <Skeleton className="h-8 w-16 rounded-full bg-sunset-wash" /> : undefined}
      />

      {!isEdit && (
        <div className="flex items-center justify-center gap-1.5 py-3">
          <Skeleton className="h-1.5 w-5 rounded-full bg-ink/20" />
          <Skeleton className="h-1.5 w-1.5 rounded-full" />
          <Skeleton className="h-1.5 w-1.5 rounded-full" />
          <Skeleton className="h-1.5 w-1.5 rounded-full" />
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
        {isEdit ? (
          <>
            <section className="pt-6">
              <Skeleton className="h-6 w-56 rounded-full" />
              <Skeleton className="mt-2 h-4 w-full rounded-full" />
            </section>
            <section className="mt-6 space-y-4">
              <div className="rounded-[22px] border border-line bg-card p-4">
                <Skeleton className="aspect-[16/10] w-full rounded-xl" />
              </div>
            </section>
          </>
        ) : (
          <section className="flex min-h-[70%] flex-col items-center justify-center pt-10">
            <Skeleton className="h-[88px] w-[88px] rounded-full bg-sunset-wash" />
            <Skeleton className="mt-8 h-8 w-48 rounded-full" />
            <Skeleton className="mt-3 h-4 w-56 rounded-full" />
            <Skeleton className="mt-8 h-12 w-40 rounded-full bg-sunset-wash" />
          </section>
        )}
      </main>
    </MobileFrame>
  );
}
