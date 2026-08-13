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
  // WAVE-G G4: 기록 생성·수정 스켈레톤은 같은 4점 스텝. 수정은 기본 2(순서) 화면.

  return (
    <MobileFrame shell>
      <AppHeader back={back} closeButton title={isEdit ? "코스 수정" : "새 코스"} />

      <div className="flex items-center justify-center gap-1.5 py-3">
        {isEdit ? (
          <>
            <Skeleton className="h-1.5 w-1.5 rounded-full bg-ink/70" />
            <Skeleton className="h-1.5 w-5 rounded-full bg-ink/20" />
            <Skeleton className="h-1.5 w-1.5 rounded-full" />
            <Skeleton className="h-1.5 w-1.5 rounded-full" />
          </>
        ) : (
          <>
            <Skeleton className="h-1.5 w-5 rounded-full bg-ink/20" />
            <Skeleton className="h-1.5 w-1.5 rounded-full" />
            <Skeleton className="h-1.5 w-1.5 rounded-full" />
            <Skeleton className="h-1.5 w-1.5 rounded-full" />
          </>
        )}
      </div>

      {isEdit ? (
        <main className="no-scrollbar flex-1 overflow-y-auto px-5 pb-28 pt-4">
          <Skeleton className="h-3.5 w-40 rounded-full" />
          <Skeleton className="mt-2 h-8 w-56 rounded-full" />
          <Skeleton className="mt-2 h-4 w-full rounded-full" />
          <Skeleton className="mt-6 aspect-[16/10] w-full rounded-[22px]" />
          <Skeleton className="mx-auto mt-3 h-8 w-16 rounded-full" />
          <Skeleton className="mt-3 aspect-[16/10] w-full rounded-[22px]" />
        </main>
      ) : (
        <main className="no-scrollbar flex-1 overflow-y-auto px-4 pb-28">
          <section className="flex min-h-[70%] flex-col items-center justify-center pt-10">
            <Skeleton className="h-[88px] w-[88px] rounded-full bg-sunset-wash" />
            <Skeleton className="mt-8 h-8 w-48 rounded-full" />
            <Skeleton className="mt-3 h-4 w-56 rounded-full" />
            <Skeleton className="mt-8 h-12 w-40 rounded-full bg-sunset-wash" />
          </section>
        </main>
      )}
    </MobileFrame>
  );
}
