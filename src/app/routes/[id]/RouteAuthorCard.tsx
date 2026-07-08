import Link from "next/link";
import type { RouteAuthor } from "@/lib/types";

/**
 * A prominent, easy-to-tap entry point to the route author's profile. Lives in
 * the route detail body so visitors can jump from "I like this route" to "who
 * made it / should I follow them?" without hunting for the small hero byline.
 */
export default function RouteAuthorCard({ author }: { author: RouteAuthor }) {
  if (!author.handle) return null;

  return (
    <Link
      href={`/u/${author.handle}`}
      className="flex items-center gap-3 rounded-[var(--radius-card)] border border-line bg-card p-3 shadow-[var(--shadow-sm)] transition active:scale-[0.99]"
    >
      <span className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-sunset-wash ring-1 ring-sunset/20">
        {author.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={author.avatarUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="text-[17px] font-black text-sunset">
            {author.displayName.charAt(0)}
          </span>
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-bold text-ink">
          {author.displayName}
        </span>
        <span className="block truncate text-[12px] text-ink-faint">
          @{author.handle} · 코스 보기
        </span>
      </span>
      <ChevronIcon />
    </Link>
  );
}

function ChevronIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="shrink-0 text-ink-faint">
      <path
        d="m9 6 6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
