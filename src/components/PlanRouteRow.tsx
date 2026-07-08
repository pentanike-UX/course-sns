import Link from "next/link";
import type { RouteSummary } from "@/lib/types";
import { formatDate } from "@/lib/format";

/**
 * Compact list row for the 계획 segment — a planning workspace reads better
 * as a scannable list than as tall photo cards. No cover image; a map glyph
 * stands in on the left since plans live on the map.
 */
export default function PlanRouteRow({ route }: { route: RouteSummary }) {
  return (
    <Link
      href={`/routes/${route.id}`}
      className="flex items-center gap-3 rounded-[var(--radius-card)] border border-line bg-card p-2.5"
    >
      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-sunset-wash text-sunset">
        <MapIcon />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="rounded-full bg-sunset-wash px-2 py-0.5 text-[10px] font-bold text-sunset-ink">
            계획
          </span>
          <span className="truncate text-[12px] text-ink-faint">{route.region}</span>
        </span>
        <span className="mt-1 block truncate text-[15px] font-bold text-ink">{route.title}</span>
        <span className="mt-0.5 block text-[12px] text-ink-faint">
          스팟 {route.spotCount} · {formatDate(route.createdAt)}
        </span>
      </span>
      <ChevronIcon />
    </Link>
  );
}

function MapIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Zm0 0v14m6-12v14"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="shrink-0 text-ink-faint">
      <path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
