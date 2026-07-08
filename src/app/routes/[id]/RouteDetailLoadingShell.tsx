"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import RoutePlanThumbnail from "@/components/RoutePlanThumbnail";
import { readPendingRoute, ROUTE_ENTER_MORPH_NAME } from "@/lib/pending-route";
import { ViewTransition } from "@/lib/view-transition";
import RouteDetailChromeTone from "./RouteDetailChromeTone";
import RouteHeroMeta from "./RouteHeroMeta";

export default function RouteDetailLoadingShell() {
  const pathname = usePathname();
  const routeId = pathname?.match(/^\/routes\/([^/]+)/)?.[1];
  const pending = readPendingRoute(routeId);
  const isPlan = pending?.copyPurpose === "plan";
  const layout = readStoredLayout();
  const isLayoutB = !isPlan && layout === "B";
  const spotSkeletonCount = Math.max(2, Math.min(pending?.spotCount ?? 3, 4));

  return (
    <>
      <RouteDetailChromeTone />
      <div className="fixed inset-x-0 top-0 z-30 h-[calc(env(safe-area-inset-top)+3.5rem)] w-full">
        <AppHeader
          back="/"
          transparent
          glass
          right={<LoadingHeaderControls isPlan={isPlan} />}
        />
      </div>

      <section
        className={`relative w-full overflow-hidden bg-line ${
          isPlan
            ? "h-[58vh] min-h-[430px]"
            : isLayoutB
              ? "aspect-[4/5]"
              : "h-[52vh] max-h-[560px] min-h-[300px]"
        }`}
      >
        {isPlan ? (
          <RoutePlanThumbnail
            points={pending?.thumbnailPoints}
            className="absolute inset-0 opacity-95"
          />
        ) : (
          <ViewTransition name={ROUTE_ENTER_MORPH_NAME} share="route-cover-morph">
            <div className="absolute inset-0 overflow-hidden">
              {pending?.coverPhotoUrl ? (
                <Image
                  src={pending.coverPhotoUrl}
                  alt={pending.title}
                  fill
                  sizes="430px"
                  className="object-cover"
                  loading="eager"
                  fetchPriority="high"
                />
              ) : (
                <div className="h-full w-full animate-pulse bg-muted" />
              )}
            </div>
          </ViewTransition>
        )}
        {isPlan && (
          <div className="absolute left-4 right-4 top-16 z-[2] flex items-start justify-between gap-3">
            <div className="rounded-2xl bg-card/92 px-3 py-2 shadow-sm ring-1 ring-white/50 backdrop-blur">
              <div className="text-[11px] font-semibold text-ink-faint">지도 위 여행 계획</div>
              <div className="mt-0.5 text-[14px] font-black text-ink">
                스팟 {pending?.spotCount ?? 0}곳
              </div>
            </div>
            <span className="rounded-full bg-sunset px-3 py-1.5 text-[12px] font-black text-white shadow-sm">
              계획 중
            </span>
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/25" />
        <div className={`absolute inset-x-0 bottom-0 z-[3] p-4 text-white ${isPlan ? "pb-6" : isLayoutB ? "pb-12" : ""}`}>
          {pending ? (
            <RouteHeroMeta meta={pending} />
          ) : (
            <>
              <div className="h-4 w-24 animate-pulse rounded-full bg-white/30" />
              <div className="mt-2 h-7 w-4/5 animate-pulse rounded-full bg-white/35" />
              <div className="mt-2 flex gap-1.5">
                <div className="h-6 w-16 animate-pulse rounded-full bg-white/25" />
                <div className="h-6 w-14 animate-pulse rounded-full bg-white/25" />
              </div>
            </>
          )}
        </div>
      </section>

      {pending?.visibility === "public" && (
        <section className="flex flex-wrap items-center gap-2 px-4 pt-4">
          <div className="h-9 w-24 animate-pulse rounded-full bg-muted" />
          <div className="h-9 w-36 animate-pulse rounded-full bg-muted" />
        </section>
      )}

      <section className="px-4 pt-7">
        <div className="h-5 w-32 animate-pulse rounded-full bg-muted" />
        <div className="mt-4 space-y-5">
          {Array.from({ length: spotSkeletonCount }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="h-7 w-7 shrink-0 animate-pulse rounded-full bg-muted" />
              <div className="min-w-0 flex-1">
                <div className="h-4 w-2/3 animate-pulse rounded-full bg-muted" />
                <div className="mt-2 h-3 w-full animate-pulse rounded-full bg-muted" />
                <div className="mt-2 h-3 w-4/5 animate-pulse rounded-full bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function readStoredLayout(): "A" | "B" {
  if (typeof window === "undefined") return "A";
  try {
    return window.localStorage.getItem("routeLayout") === "B" ? "B" : "A";
  } catch {
    return "A";
  }
}

function LoadingHeaderControls({ isPlan }: { isPlan: boolean }) {
  return (
    <div className="flex items-center gap-1" aria-hidden>
      {!isPlan && (
        <div className="flex h-9 items-center rounded-full bg-white/45 p-1 text-ink-soft shadow-sm ring-1 ring-white/50 backdrop-blur-md dark:bg-black/35 dark:ring-white/20">
          <span className="flex h-7 min-w-[34px] items-center justify-center rounded-full bg-white px-2.5 text-[13px] font-bold text-[#16211c] shadow-sm dark:bg-white/20 dark:text-white">
            A
          </span>
          <span className="flex h-7 min-w-[34px] items-center justify-center rounded-full px-2.5 text-[13px] font-bold">
            B
          </span>
        </div>
      )}
      <div className="flex h-11 w-11 items-center justify-center">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/45 text-[#16211c] shadow-sm ring-1 ring-white/50 backdrop-blur-md dark:bg-black/35 dark:text-white dark:ring-white/20">
          <DotsIcon />
        </span>
      </div>
    </div>
  );
}

function DotsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="5" r="1.7" />
      <circle cx="12" cy="12" r="1.7" />
      <circle cx="12" cy="19" r="1.7" />
    </svg>
  );
}
