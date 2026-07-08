import Image from "next/image";
import Link from "next/link";
import RoutePlanThumbnail from "@/components/RoutePlanThumbnail";
import { getRouteCopyStats, type RouteCopyStats } from "@/lib/data";

export default async function RouteCopyLineageSection({ routeId }: { routeId: string }) {
  const stats = await getRouteCopyStats(routeId);
  return <CopyLineageContent stats={stats} />;
}

export function RouteCopyLineageFallback() {
  return (
    <section className="px-4 pt-7" aria-busy="true">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="h-5 w-40 animate-pulse rounded-full bg-muted" />
          <div className="mt-2 h-3.5 w-56 animate-pulse rounded-full bg-muted" />
        </div>
        <div className="h-7 w-10 animate-pulse rounded-full bg-muted" />
      </div>
      <div className="mt-3 flex gap-2">
        <div className="h-7 w-14 animate-pulse rounded-full bg-muted" />
        <div className="h-7 w-14 animate-pulse rounded-full bg-muted" />
      </div>
    </section>
  );
}

function CopyLineageContent({ stats }: { stats?: RouteCopyStats | null }) {
  if (!stats || stats.total === 0) return null;

  return (
    <section className="px-4 pt-7">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-[16px] font-bold text-ink">이 코스를 따라간 사람들</h2>
          <p className="mt-0.5 text-[12px] leading-relaxed text-ink-faint">
            {stats.total}명이 이 코스를 내 여행 초안으로 가져갔어요.
          </p>
        </div>
        <div className="shrink-0 rounded-full bg-sunset-wash px-2.5 py-1 text-[12px] font-bold text-sunset-ink">
          {stats.total}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <LineagePill label="계획" value={stats.planCount} />
        <LineagePill label="기록" value={stats.recordCount} />
        {stats.privateCount > 0 && <LineagePill label="비공개" value={stats.privateCount} muted />}
      </div>

      {stats.publicCopies.length > 0 && (
        <div className="no-scrollbar -mr-4 mt-4 flex gap-3 overflow-x-auto pr-4">
          {stats.publicCopies.map((route) => (
            <Link
              key={route.id}
              href={`/routes/${route.id}`}
              className="w-36 shrink-0 overflow-hidden rounded-[var(--radius-card)] border border-line bg-card"
            >
              <div className="relative aspect-[4/5] bg-line">
                {route.coverPhotoUrl ? (
                  <Image
                    src={route.coverPhotoUrl}
                    alt={route.title}
                    fill
                    sizes="144px"
                    className="object-cover"
                  />
                ) : (
                  <RoutePlanThumbnail points={route.thumbnailPoints} className="absolute inset-0" />
                )}
                <span className="absolute left-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur">
                  {copyPurposeLabel(route.copyPurpose)}
                </span>
              </div>
              <div className="p-2.5">
                <div className="line-clamp-2 text-[12px] font-bold leading-snug text-ink">
                  {route.title}
                </div>
                <div className="mt-1 truncate text-[11px] text-ink-faint">
                  {route.author.displayName}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {stats.privateCount > 0 && (
        <p className="mt-3 rounded-xl border border-dashed border-line bg-card px-3 py-2 text-[12px] leading-relaxed text-ink-faint">
          비공개로 가져간 루트 {stats.privateCount}개는 제목과 사진 없이 집계만 보여요.
        </p>
      )}
    </section>
  );
}

function LineagePill({
  label,
  value,
  muted,
}: {
  label: string;
  value: number;
  muted?: boolean;
}) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[12px] font-semibold ${
        muted ? "bg-muted text-ink-faint" : "bg-card text-ink-soft ring-1 ring-line"
      }`}
    >
      {label} {value}
    </span>
  );
}

function copyPurposeLabel(purpose: "plan" | "record") {
  return purpose === "plan" ? "계획" : "기록";
}
