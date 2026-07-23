import Image from "next/image";
import Link from "next/link";
import type { RouteSummary } from "@/lib/types";

/**
 * Weak home rail for P4 — only when the viewer follows makers who published.
 * Lives below FeedControls (not in the hero chrome).
 */
export default function FollowingRail({ courses }: { courses: RouteSummary[] }) {
  if (courses.length === 0) return null;
  const slice = courses.slice(0, 8);

  return (
    <section className="border-b border-line px-4 py-3" aria-label="팔로잉의 새 코스">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h2 className="text-[13px] font-bold text-ink">팔로잉의 새 코스</h2>
        <Link
          href="/library?tab=people"
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
