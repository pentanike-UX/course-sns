import Image from "next/image";
import Link from "next/link";
import type { RouteSummary } from "@/lib/types";

/**
 * P4 home rail — following makers' new courses.
 * Always shows when the viewer is logged in (empty = learn the slot exists).
 * FOL-02: stream CTA → subscribed; people only when empty / find makers.
 */
export default function FollowingRail({
  courses,
  signedIn,
}: {
  courses: RouteSummary[];
  /** when true and courses empty, render a discover placeholder */
  signedIn?: boolean;
}) {
  if (courses.length === 0) {
    if (!signedIn) return null;
    return (
      <section className="border-b border-line px-4 py-3" aria-label="구독 중인 새 코스">
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <h2 className="text-[13px] font-bold text-ink">구독 중인 새 코스</h2>
          <Link
            href="/library?tab=people"
            className="text-[12px] font-semibold text-ink-soft underline-offset-2 hover:underline"
          >
            사람 찾기
          </Link>
        </div>
        <div className="rounded-2xl bg-muted/70 px-3.5 py-3 ring-1 ring-line/70">
          <p className="text-[13px] font-semibold text-ink">아직 구독 중인 메이커가 없어요</p>
          <p className="mt-1 text-[12px] leading-relaxed text-ink-soft">
            취향 맞는 사람을 팔로우하면 새 코스가 여기로 와요.
          </p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            <Link
              href="/"
              className="rounded-full bg-ink px-3.5 py-1.5 text-[12px] font-bold text-paper"
            >
              코스 둘러보기
            </Link>
            <Link
              href="/library?tab=people"
              className="rounded-full border border-line bg-card px-3.5 py-1.5 text-[12px] font-semibold text-ink-soft"
            >
              메이커 찾아보기
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const slice = courses.slice(0, 8);

  return (
    <section className="border-b border-line px-4 py-3" aria-label="구독 중인 새 코스">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h2 className="text-[13px] font-bold text-ink">구독 중인 새 코스</h2>
        <Link
          href="/library?tab=subscribed"
          className="text-[12px] font-semibold text-ink-soft underline-offset-2 hover:underline"
        >
          전체 보기
        </Link>
      </div>
      <ul className="no-scrollbar -mx-1 flex gap-2.5 overflow-x-auto px-1 pb-0.5">
        {slice.map((r) => (
          <li key={r.id} className="w-[132px] shrink-0">
            <Link
              href={`/routes/${r.id}`}
              className="block transition-transform active:scale-[0.98]"
            >
              <span className="relative block aspect-[4/3] overflow-hidden rounded-xl bg-muted ring-1 ring-line">
                {r.coverPhotoUrl ? (
                  <Image
                    src={r.coverPhotoUrl}
                    alt=""
                    fill
                    sizes="132px"
                    className="object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-[11px] font-semibold text-ink-faint">
                    코스
                  </span>
                )}
              </span>
              <span className="mt-1.5 line-clamp-2 text-[12px] font-bold leading-snug text-ink">
                {r.title}
              </span>
              <span className="mt-0.5 block truncate text-[11px] text-ink-faint">
                {r.author.displayName}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
