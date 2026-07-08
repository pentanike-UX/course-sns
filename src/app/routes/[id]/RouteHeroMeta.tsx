import Link from "next/link";
import { formatDate } from "@/lib/format";

type HeroMeta = {
  region: string;
  title: string;
  theme?: string;
  mood?: string;
  createdAt: string;
  author: {
    handle?: string;
    displayName: string;
  };
};

export default function RouteHeroMeta({
  meta,
  className = "",
  passThrough = false,
}: {
  meta: HeroMeta;
  className?: string;
  /**
   * Let touches fall through to whatever is behind (e.g. the hero photo
   * carousel) so the title/date band is also swipeable. Only the author link
   * stays interactive. Used by Layout B where this overlays the carousel.
   */
  passThrough?: boolean;
}) {
  return (
    <div className={`${className} ${passThrough ? "pointer-events-none" : ""}`}>
      <div className="flex items-center gap-1.5 text-[13px] font-medium text-white/90 drop-shadow-sm">
        <PinIcon /> {meta.region}
      </div>
      <h1 className="mt-1 line-clamp-2 text-[24px] font-black leading-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.75)]">
        {meta.title}
      </h1>
      {(meta.theme || meta.mood) && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {meta.theme && <Chip># {meta.theme}</Chip>}
          {meta.mood && <Chip>{meta.mood}</Chip>}
        </div>
      )}
      <div className="mt-2 flex items-center gap-2 text-[13px] text-white/85 drop-shadow-sm">
        {meta.author.handle ? (
          <Link
            href={`/u/${meta.author.handle}`}
            className="pointer-events-auto font-medium underline-offset-2 hover:underline"
          >
            {meta.author.displayName}
          </Link>
        ) : (
          <span>{meta.author.displayName}</span>
        )}
        <span>·</span>
        <span>{formatDate(meta.createdAt)}</span>
      </div>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="max-w-full truncate rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">
      {children}
    </span>
  );
}

function PinIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="shrink-0">
      <path
        d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="10" r="2.4" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}
