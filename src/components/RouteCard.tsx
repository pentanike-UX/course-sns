"use client";

import { ViewTransition } from "@/lib/view-transition";
import Image from "next/image";
import Link, { useLinkStatus } from "next/link";
import { useRouter } from "next/navigation";
import { useId, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { ROUTE_ENTER_MORPH_NAME, writePendingRoute } from "@/lib/pending-route";
import type { RouteSummary } from "@/lib/types";
import { formatDate } from "@/lib/format";
import RoutePlanThumbnail from "@/components/RoutePlanThumbnail";

/** Full-bleed image card: cover fills the card, meta overlaid (date first). */
export default function RouteCard({
  route,
  showOwner = false,
  priority = false,
}: {
  route: RouteSummary;
  /** show the author (avatar + name) under the title — used in the explore feed */
  showOwner?: boolean;
  /** prioritize the cover image (use for the first, above-the-fold card → LCP) */
  priority?: boolean;
}) {
  const router = useRouter();
  const href = `/routes/${route.id}`;
  const prefetchedRef = useRef(false);
  const [entryMorphActive, setEntryMorphActive] = useState(false);
  const morphInstanceId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const morphName = entryMorphActive
    ? ROUTE_ENTER_MORPH_NAME
    : `route-cover-${route.id}-${morphInstanceId}`;

  const primeRoute = () => {
    writePendingRoute(route);
  };

  const prefetchRoute = () => {
    primeRoute();
    if (prefetchedRef.current) return;
    prefetchedRef.current = true;
    router.prefetch(href);
  };

  const activateEntryMorph = () => {
    writePendingRoute(route);
    prefetchRoute();
    if (!entryMorphActive) {
      flushSync(() => setEntryMorphActive(true));
    }
  };

  return (
    <Link
      href={href}
      onFocus={prefetchRoute}
      onMouseEnter={prefetchRoute}
      onTouchStart={prefetchRoute}
      onPointerDown={activateEntryMorph}
      onClick={activateEntryMorph}
      className="group relative block aspect-[4/5] overflow-hidden rounded-[var(--radius-card)] bg-line"
    >
      {route.coverPhotoUrl ? (
        <ViewTransition name={morphName} share="route-cover-morph">
          <span className="absolute inset-0 block overflow-hidden rounded-[inherit]">
            <Image
              src={route.coverPhotoUrl}
              alt={route.title}
              fill
              sizes="430px"
              loading={priority ? "eager" : undefined}
              fetchPriority={priority ? "high" : undefined}
              className="object-cover transition-transform duration-500 group-active:scale-[1.04]"
            />
          </span>
        </ViewTransition>
      ) : (
        <RoutePlanThumbnail points={route.thumbnailPoints} className="absolute inset-0" />
      )}

      {/* legibility gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-black/30" />
      <RouteCardPendingHint />

      {/* top row: region + private badge */}
      <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3.5">
        <span className="flex items-center gap-1 text-[12px] font-medium text-white/90 drop-shadow">
          <PinIcon /> {route.region}
        </span>
        {route.visibility === "private" && (
          <span className="rounded-full bg-black/40 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur">
            비공개
          </span>
        )}
      </div>

      {/* bottom: date (emphasized) → title → chips */}
      <div className="absolute inset-x-0 bottom-0 p-4 text-white">
        <div className="text-[21px] font-black leading-tight drop-shadow-sm">
          {formatDate(route.createdAt)}
        </div>
        <h3 className="mt-0.5 line-clamp-2 text-[15px] font-bold leading-snug text-white/95 drop-shadow-sm">
          {route.title}
        </h3>

        {showOwner && (
          <span
            role={route.author.handle ? "link" : undefined}
            tabIndex={route.author.handle ? 0 : undefined}
            onPointerDown={(e) => {
              if (route.author.handle) e.stopPropagation();
            }}
            onClick={(e) => {
              if (!route.author.handle) return;
              e.preventDefault();
              e.stopPropagation();
              router.push(`/u/${route.author.handle}`);
            }}
            onKeyDown={(e) => {
              if (route.author.handle && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                router.push(`/u/${route.author.handle}`);
              }
            }}
            className="mt-2 flex w-fit items-center gap-1.5"
          >
            {route.author.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={route.author.avatarUrl}
                alt=""
                className="h-[18px] w-[18px] rounded-full object-cover ring-1 ring-white/40"
              />
            ) : (
              <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-white/25 text-[10px] font-bold text-white ring-1 ring-white/40">
                {route.author.displayName.charAt(0)}
              </span>
            )}
            <span className="max-w-[60%] truncate text-[12px] font-medium text-white/90 drop-shadow-sm">
              {route.author.displayName}
            </span>
          </span>
        )}

        <div className="mt-2.5 flex items-center gap-1.5">
          {route.theme && <Chip>{route.theme}</Chip>}
          {route.mood && <Chip>{route.mood}</Chip>}
          <span className="ml-auto flex items-center gap-2 text-[12px] text-white/85">
            <span>스팟 {route.spotCount}</span>
            {route.visibility === "public" && (
              <span className="flex items-center gap-1">
                <HeartIcon /> {route.likeCount}
              </span>
            )}
          </span>
        </div>
      </div>
    </Link>
  );
}

function RouteCardPendingHint() {
  const { pending } = useLinkStatus();

  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute inset-0 z-10 bg-white/10 backdrop-blur-[1px] transition-opacity duration-150 ${
        pending ? "opacity-100" : "opacity-0"
      }`}
    >
      <span className="route-card-pending-sheen absolute inset-0 opacity-70" />
    </span>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="max-w-[45%] truncate rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur">
      {children}
    </span>
  );
}

function PinIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="10" r="2.4" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}
