"use client";

import { ViewTransition } from "@/lib/view-transition";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useRef, useState } from "react";
import { flushSync } from "react-dom";
import RoutePlanThumbnail from "@/components/RoutePlanThumbnail";
import { formatDate } from "@/lib/format";
import { ROUTE_ENTER_MORPH_NAME, writePendingRoute } from "@/lib/pending-route";
import type { RouteSummary } from "@/lib/types";
import type { FeedLayout } from "./FeedControls";
import { courseSpecParts } from "@/lib/course-spec";

export default function FeedRouteCard({
  route,
  layout,
  priority = false,
}: {
  route: RouteSummary;
  layout: FeedLayout;
  priority?: boolean;
}) {
  const router = useRouter();
  const href = `/routes/${route.id}`;
  const prefetchedRef = useRef(false);
  const [entryMorphActive, setEntryMorphActive] = useState(false);
  const morphInstanceId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const morphName = entryMorphActive
    ? ROUTE_ENTER_MORPH_NAME
    : `feed-route-cover-${route.id}-${layout}-${morphInstanceId}`;

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

  const commonProps = {
    href,
    onFocus: prefetchRoute,
    onMouseEnter: prefetchRoute,
    onTouchStart: prefetchRoute,
    onPointerDown: activateEntryMorph,
    onClick: activateEntryMorph,
  };

  if (layout === "small") {
    return (
      <Link
        {...commonProps}
        className="group flex min-h-[112px] gap-3 overflow-hidden rounded-[var(--radius-card)] border border-line bg-card p-2.5 shadow-[var(--shadow-sm)]"
      >
        <div className="relative h-[92px] w-[92px] shrink-0 overflow-hidden rounded-[calc(var(--radius-card)-2px)] bg-line">
          <Cover route={route} morphName={morphName} priority={priority} sizes="92px" />
        </div>
        <div className="min-w-0 flex-1 py-0.5">
          <OwnerLine route={route} />
          <h3 className="mt-1 line-clamp-2 text-[15px] font-black leading-snug text-ink">
            {route.title}
          </h3>
          <SpecLine route={route} className="mt-1.5 text-ink-soft" />
          <p className="mt-1 flex items-center gap-1 truncate text-[12px] font-medium text-ink-faint">
            <PinIcon /> <span className="truncate">{route.region}</span>
          </p>
          <MetaRow route={route} className="mt-2" />
        </div>
      </Link>
    );
  }

  if (layout === "large") {
    return (
      <Link
        {...commonProps}
        className="group block overflow-hidden rounded-[var(--radius-card)] border border-line bg-card shadow-[var(--shadow-sm)]"
      >
        <div className="relative aspect-[16/10] overflow-hidden bg-line">
          <Cover route={route} morphName={morphName} priority={priority} sizes="430px" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/72 via-black/10 to-black/15" />
          <div className="absolute left-3 right-3 top-3 flex items-center justify-between gap-2">
            <OwnerPill route={route} />
            <TransferPill route={route} />
          </div>
          <div className="absolute inset-x-0 bottom-0 p-4 text-white">
            <h3 className="line-clamp-2 text-[21px] font-black leading-tight drop-shadow-sm">
              {route.title}
            </h3>
            <p className="mt-1 flex items-center gap-1 text-[12px] font-medium text-white/85">
              <PinIcon /> {route.region}
            </p>
            <SpecLine route={route} className="mt-2 text-white/85" />
          </div>
        </div>
        <div className="flex items-center gap-2 px-3.5 py-3 text-[12px] font-medium text-ink-faint">
          <span>스팟 {route.spotCount}개</span>
          <span className="h-1 w-1 rounded-full bg-line" />
          <span>{formatDate(route.createdAt)}</span>
          {route.theme && <span className="ml-auto"><MiniChip>{route.theme}</MiniChip></span>}
        </div>
      </Link>
    );
  }

  return (
    <Link
      {...commonProps}
      className="group relative block aspect-[1/1.22] overflow-hidden rounded-[var(--radius-card)] bg-line shadow-[var(--shadow-sm)]"
    >
      <Cover route={route} morphName={morphName} priority={priority} sizes="210px" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/78 via-black/10 to-black/20" />
      <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-2.5">
        <OwnerPill route={route} compact />
        <TransferPill route={route} compact />
      </div>
      <div className="absolute inset-x-0 bottom-0 p-3 text-white">
        <h3 className="line-clamp-2 text-[15px] font-black leading-tight text-white">
          {route.title}
        </h3>
        <p className="mt-1 flex items-center gap-1 truncate text-[11px] font-medium text-white/85">
          <PinIcon /> <span className="truncate">{route.region}</span>
        </p>
        <SpecLine route={route} className="mt-1.5 text-white/80" />
        <p className="mt-1.5 text-[11px] font-medium text-white/75">
          스팟 {route.spotCount}개 · {formatDate(route.createdAt)}
        </p>
      </div>
    </Link>
  );
}

function Cover({
  route,
  morphName,
  priority,
  sizes,
}: {
  route: RouteSummary;
  morphName: string;
  priority: boolean;
  sizes: string;
}) {
  return route.coverPhotoUrl ? (
    <ViewTransition name={morphName} share="route-cover-morph">
      <span className="absolute inset-0 block overflow-hidden rounded-[inherit]">
        <Image
          src={route.coverPhotoUrl}
          alt={route.title}
          fill
          sizes={sizes}
          loading={priority ? "eager" : undefined}
          fetchPriority={priority ? "high" : undefined}
          className="object-cover transition-transform duration-500 group-active:scale-[1.04]"
        />
      </span>
    </ViewTransition>
  ) : (
    <RoutePlanThumbnail points={route.thumbnailPoints} className="absolute inset-0" />
  );
}

/**
 * A tappable author target nested inside the card's <Link>. Uses role="link"
 * (not <a>) to avoid invalid nested anchors, and stops pointer/click from
 * bubbling so tapping the author opens the profile instead of the route.
 */
function AuthorTap({
  handle,
  className,
  children,
}: {
  handle?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  if (!handle) return <span className={className}>{children}</span>;
  const go = () => router.push(`/u/${handle}`);
  return (
    <span
      role="link"
      tabIndex={0}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        go();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          go();
        }
      }}
      className={className}
    >
      {children}
    </span>
  );
}

function OwnerLine({ route }: { route: RouteSummary }) {
  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <AuthorTap handle={route.author.handle} className="flex min-w-0 items-center gap-1.5">
        <Avatar route={route} size="sm" />
        <span className="truncate text-[12px] font-bold text-ink-soft">
          {route.author.displayName}
        </span>
      </AuthorTap>
      <span className="ml-auto shrink-0 text-[11px] font-medium text-ink-faint">
        {formatDate(route.createdAt)}
      </span>
    </div>
  );
}

function OwnerPill({ route, compact = false }: { route: RouteSummary; compact?: boolean }) {
  return (
    <AuthorTap
      handle={route.author.handle}
      className={`flex min-w-0 items-center gap-1.5 rounded-full bg-black/38 text-white shadow-sm backdrop-blur ${
        compact ? "max-w-[112px] px-2 py-1 text-[11px]" : "max-w-[180px] px-2.5 py-1.5 text-[12px]"
      }`}
    >
      <Avatar route={route} size={compact ? "xs" : "sm"} />
      <span className="truncate font-bold">{route.author.displayName}</span>
    </AuthorTap>
  );
}

function SpecLine({ route, className = "" }: { route: RouteSummary; className?: string }) {
  const parts = courseSpecParts({
    durationMin: route.totalDurationMin,
    distanceMeters: route.approxDistanceM,
    transitLabel: route.transitLabel,
    difficulty: route.difficulty,
  });
  if (!parts.length) return null;
  return (
    <p className={`truncate text-[11px] font-semibold tracking-tight ${className}`}>
      {parts.join(" · ")}
    </p>
  );
}

function TransferPill({ route, compact = false }: { route: RouteSummary; compact?: boolean }) {
  const copies = route.copyCount ?? 0;
  const done = route.completionCount ?? 0;
  const label =
    copies > 0
      ? `${copies} 따라감`
      : done > 0
        ? `${done} 다녀옴`
        : route.recommendedFor?.split(",")[0]?.trim() ||
          (route.difficulty === "easy"
            ? "가볍게"
            : route.difficulty === "hard"
              ? "많이 걸어요"
              : null);

  if (!label && route.likeCount <= 0) return null;

  return (
    <span
      className={`flex shrink-0 items-center gap-1 rounded-full bg-white/88 font-black text-ink shadow-sm ring-1 ring-black/[0.04] backdrop-blur ${
        compact ? "max-w-[108px] px-2 py-1 text-[11px]" : "px-2.5 py-1.5 text-[12px]"
      }`}
    >
      {copies > 0 ? (
        <>
          <FollowGlyph /> <span className="truncate">{label}</span>
        </>
      ) : done > 0 ? (
        <>
          <DoneGlyph /> <span className="truncate">{label}</span>
        </>
      ) : label ? (
        <span className="truncate font-bold text-ink-soft">{label}</span>
      ) : (
        <>
          <HeartIcon /> {route.likeCount}
        </>
      )}
    </span>
  );
}

function MetaRow({ route, className = "" }: { route: RouteSummary; className?: string }) {
  const purpose = route.recommendedFor?.split(",")[0]?.trim();
  const copies = route.copyCount ?? 0;
  const done = route.completionCount ?? 0;
  return (
    <div className={`flex min-w-0 items-center gap-1.5 text-[12px] font-medium text-ink-faint ${className}`}>
      {purpose && <MiniChip>{purpose}</MiniChip>}
      {route.theme && !purpose && <MiniChip>{route.theme}</MiniChip>}
      <span className="ml-auto shrink-0">스팟 {route.spotCount}</span>
      {copies > 0 ? (
        <span className="flex shrink-0 items-center gap-1 text-ink-soft" aria-label={`${copies}명이 따라감`}>
          <FollowGlyph /> {copies}
        </span>
      ) : done > 0 ? (
        <span className="flex shrink-0 items-center gap-1 text-ink-soft" aria-label={`${done}명이 다녀옴`}>
          <DoneGlyph /> {done}
        </span>
      ) : (
        <span className="flex shrink-0 items-center gap-1 text-ink-soft">
          <HeartIcon /> {route.likeCount}
        </span>
      )}
    </div>
  );
}

function MiniChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="max-w-[72px] truncate rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-ink-soft">
      {children}
    </span>
  );
}

function Avatar({ route, size }: { route: RouteSummary; size: "xs" | "sm" }) {
  const cls = size === "xs" ? "h-4 w-4 text-[9px]" : "h-[18px] w-[18px] text-[10px]";
  return route.author.avatarUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={route.author.avatarUrl}
      alt=""
      className={`${cls} shrink-0 rounded-full object-cover ring-1 ring-white/45`}
    />
  ) : (
    <span
      className={`${cls} flex shrink-0 items-center justify-center rounded-full bg-white/25 font-bold text-white ring-1 ring-white/45`}
    >
      {route.author.displayName.charAt(0)}
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

function HeartIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" className="shrink-0">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}

function FollowGlyph() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="shrink-0" aria-hidden>
      <path
        d="M4 12h12M12 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DoneGlyph() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="shrink-0" aria-hidden>
      <path
        d="M20 6 9 17l-5-5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
