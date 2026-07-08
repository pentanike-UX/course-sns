"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import FeedControls, {
  type FeedLayout,
  type FeedMode,
  type FeedSortClient,
  type FeedView,
} from "./FeedControls";
import FeedMap from "./FeedMap";
import FeedRouteCard from "./FeedRouteCard";
import FeedSearchOverlay from "./FeedSearchOverlay";
import FeedFilterSheet from "@/components/FeedFilterSheet";
import GlassCircle from "@/components/GlassCircle";
import SlideDrawer from "@/components/SlideDrawer";
import DiaryDrawerContent from "@/components/DiaryDrawerContent";
import DiaryDrawerSkeleton from "@/components/DiaryDrawerSkeleton";
import { useAuthGate } from "@/components/AuthGate";
import type { HomeTab } from "@/app/(tabs)/HomeRoutesTabs";
import { preloadRouteCovers } from "@/lib/preload-route-covers";
import { scheduleIdleTask } from "@/lib/schedule-idle-task";
import { useOverlayStack } from "@/lib/use-overlay-stack";
import { useSheetTransition } from "@/lib/use-sheet-transition";
import type { FeedMapPoint } from "@/lib/data";
import type { RouteSummary, RouteAuthor } from "@/lib/types";
import {
  EMPTY_FILTERS,
  appendFilterParams,
  filterCount,
  routeMatchesFilters,
  type FeedFilters,
} from "@/lib/feed-filters";

// 지도 ↔ 둘러보기 conveyor timing. The bottom nav stays put and just moves its
// selection to the 지도 tab; MAP_SLIDE_DELAY holds the screen slide back until
// that focus/jelly settle (the nav blob's 520ms spring) has finished, so the
// screens only start moving once the focus has landed. Exit slides immediately
// (delay 0), so MAP_EXIT_MS only needs to outlast the slide itself.
const MAP_SLIDE_MS = 380;
const MAP_SLIDE_DELAY = 520;
const MAP_EXIT_MS = 460;

// persistence so the feed view survives a round-trip to a route detail (the feed
// remounts on back, which would otherwise reset the layout + filters to defaults).
const LAYOUT_KEY = "routdiary:feed-layout";
const LAYOUT_EVENT = "routdiary:feed-layout-change";
const FILTERS_KEY = "routdiary:feed-filters";
const FILTERS_EVENT = "routdiary:feed-filters-change";
const DEFAULT_LAYOUT: FeedLayout = "grid";

function readLayout(): FeedLayout {
  if (typeof window === "undefined") return DEFAULT_LAYOUT;
  try {
    const v = localStorage.getItem(LAYOUT_KEY);
    if (v === "grid" || v === "small" || v === "large") return v;
  } catch {
    /* ignore */
  }
  return DEFAULT_LAYOUT;
}

function subscribeLayout(onChange: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key === LAYOUT_KEY) onChange();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(LAYOUT_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(LAYOUT_EVENT, onChange);
  };
}

function serializeFilters(f: FeedFilters) {
  return JSON.stringify({ kinds: f.kinds, themes: f.themes, moods: f.moods, regions: f.regions });
}

/** Raw serialized filters from sessionStorage, or null when nothing is stored.
 *  Returned as a string so useSyncExternalStore compares snapshots by value. */
function readStoredFilters(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(FILTERS_KEY);
  } catch {
    return null;
  }
}

function subscribeFilters(onChange: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key === FILTERS_KEY) onChange();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(FILTERS_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(FILTERS_EVENT, onChange);
  };
}

function feedUrl(
  q: string,
  sort: FeedSortClient,
  view: FeedView,
  mode: FeedMode,
  filters: FeedFilters,
) {
  const params = new URLSearchParams();
  if (q.trim()) params.set("q", q.trim());
  if (sort !== "recent") params.set("sort", sort);
  if (view !== "all") params.set("view", view);
  if (mode !== "list") params.set("mode", mode);
  appendFilterParams(params, filters);
  return `/${params.toString() ? `?${params}` : ""}`;
}

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

/**
 * 둘러보기 shell: owns the 전체/팔로잉 view client-side so the segment
 * switches instantly (both feeds are prefetched by the page); 검색·정렬·
 * 지도 모드 still navigate server-side via URL. The card layout is local UI
 * state so the visual density change is immediate.
 */
export default function FeedExplorer({
  q,
  sort,
  mode,
  profile,
  initialFilters,
  allRoutes,
  allPoints,
  myRoutes,
  diaryTab = "all",
  notificationBell,
  profileActions,
  profileDrawer,
}: {
  q: string;
  sort: FeedSortClient;
  mode: FeedMode;
  profile?: RouteAuthor | null;
  initialFilters: FeedFilters;
  allRoutes?: RouteSummary[];
  allPoints?: FeedMapPoint[];
  myRoutes: RouteSummary[];
  diaryTab?: HomeTab;
  notificationBell: ReactNode;
  profileActions: ReactNode;
  profileDrawer: ReactNode;
}) {
  const router = useRouter();
  const { requireAuth } = useAuthGate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [diaryOpen, setDiaryOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [diaryWarm, setDiaryWarm] = useState(false);
  const overlays = useOverlayStack<"diary" | "profile">();
  const { register: registerOverlay, open: openOverlay, close: closeOverlay } = overlays;

  useEffect(() => {
    registerOverlay("diary", setDiaryOpen);
    registerOverlay("profile", setProfileOpen);
  }, [registerOverlay]);

  const openDiary = () => {
    if (diaryOpen) return;
    openOverlay("diary");
  };

  const openProfile = () => {
    if (profileOpen) return;
    openOverlay("profile");
  };

  const closeProfile = () => closeOverlay("profile");

  const closeDiary = () => {
    if (profileOpen) return;
    closeOverlay("diary");
  };

  const diaryContent = (
    <DiaryDrawerContent
      displayName={profile?.displayName ?? "여행자"}
      routes={myRoutes}
      initialTab={diaryTab}
      overlayUrl
    />
  );

  // Idle warm: preload top covers + mount drawers off-screen so the first open feels instant.
  useEffect(() => {
    if (!profile || diaryWarm) return;
    return scheduleIdleTask(() => {
      preloadRouteCovers(myRoutes, 3);
      setDiaryWarm(true);
    });
  }, [profile, diaryWarm, myRoutes]);

  // Auto-hide the identity header on scroll-down, reveal on scroll-up — the
  // filter toolbar below it stays pinned. Mirrors the bottom nav so the top and
  // bottom chrome clear together while browsing, then return on a scroll-up.
  const [headerHidden, setHeaderHidden] = useState(false);
  useEffect(() => {
    const scroller = document.querySelector<HTMLElement>("[data-tabs-scroll-root]");
    if (!scroller) return;
    let lastY = scroller.scrollTop;
    let ticking = false;
    const update = () => {
      ticking = false;
      const y = scroller.scrollTop;
      const diff = y - lastY;
      lastY = y;
      if (Math.abs(diff) < 6) return;
      if (y < 48 || diff < 0) setHeaderHidden(false);
      else if (diff > 0 && y > 72) setHeaderHidden(true);
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };
    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => scroller.removeEventListener("scroll", onScroll);
  }, []);

  // Layout (배치타입) is a sticky preference (localStorage); read it through an
  // external store so SSR/first paint stays on the default and reconciles after
  // hydration — no setState-in-effect, no hydration mismatch.
  const layout = useSyncExternalStore(subscribeLayout, readLayout, () => DEFAULT_LAYOUT);
  const changeLayout = (next: FeedLayout) => {
    try {
      localStorage.setItem(LAYOUT_KEY, next);
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new Event(LAYOUT_EVENT));
  };

  // Filters live in sessionStorage so they survive a route-detail round-trip
  // (shallow URL sync alone is dropped by the router cache on back). The stored
  // value is the source of truth once set; the URL only seeds the first load.
  const storedFiltersRaw = useSyncExternalStore(subscribeFilters, readStoredFilters, () => null);
  const filters = useMemo<FeedFilters>(() => {
    if (storedFiltersRaw != null) {
      try {
        const p = JSON.parse(storedFiltersRaw) as Partial<FeedFilters>;
        return {
          kinds: p.kinds ?? [],
          themes: p.themes ?? [],
          moods: p.moods ?? [],
          regions: p.regions ?? [],
        };
      } catch {
        /* ignore */
      }
    }
    return initialFilters;
  }, [storedFiltersRaw, initialFilters]);

  // sheet detent lives here (not in FeedMap) so switching 전체/팔로잉 — which
  // remounts FeedMap via its key — keeps the sheet at the same height
  const [mapDetent, setMapDetent] = useState(0);
  // 거리순: the user's current position (client-only), used to sort the list.
  const [geo, setGeo] = useState<{ lat: number; lng: number } | null>(null);
  const [geoDenied, setGeoDenied] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  // 둘러보기 no longer has a 전체/팔로잉 segment — it always shows the public feed
  // (팔로잉 moved to the 보관함 tab).
  const view: FeedView = "all";

  // 지도 view (?mode=map) slides over the list as a conveyor: the explore screen
  // is pushed off to the left while the map slides in from the right (and back on
  // exit). `render` keeps the map mounted through its closing slide; `show`
  // drives the on-screen pose. The screen slide is delayed on entry so the bottom
  // nav can drop away first (see MAP_SLIDE_DELAY / BottomNav).
  const mapActive = mode === "map";
  const { render: renderMap, show: mapShown } = useSheetTransition(mapActive, MAP_EXIT_MS);

  // Facets apply client-side (list filters the prefetched array; map re-pulls
  // the current viewport in place) — so just sync the URL shallowly.
  const applyFilters = (next: FeedFilters) => {
    try {
      sessionStorage.setItem(FILTERS_KEY, serializeFilters(next));
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new Event(FILTERS_EVENT));
    window.history.replaceState(null, "", feedUrl(q, sort, view, mode, next));
  };
  const removeFilter = (kind: keyof FeedFilters, value: string) =>
    applyFilters({ ...filters, [kind]: filters[kind].filter((x) => x !== value) });
  const countFor = (draft: FeedFilters) =>
    (allRoutes ?? []).filter((r) => routeMatchesFilters(r, draft)).length;

  // Pin the fullscreen map overlay to the visual viewport ONLY while a field is
  // focused (i.e. the soft keyboard is up). Without it, iOS scrolls the whole
  // fixed layer up on focus, carrying the 지도/목록·현위치 buttons and the sheet
  // grabber off-screen. But the visual viewport also offsets during plain
  // scrolling — reacting then would drag the whole overlay and reveal the page
  // behind it (the sheet should scroll, the map stays put). Focus is the
  // reliable keyboard signal; a height threshold is not (innerHeight tracks the
  // viewport differently across iOS versions).
  useEffect(() => {
    if (mode !== "map") return;
    const vv = window.visualViewport;
    const el = overlayRef.current;
    if (!vv || !el) return;

    let keyboard = false;
    const apply = () => {
      if (keyboard) {
        el.style.height = `${vv.height}px`;
        el.style.transform = `translateY(${vv.offsetTop}px)`;
      } else {
        el.style.height = "";
        el.style.transform = "";
      }
    };
    const isField = (n: EventTarget | null) =>
      n instanceof HTMLElement && (n.tagName === "INPUT" || n.tagName === "TEXTAREA");
    const onFocusIn = (e: FocusEvent) => {
      if (isField(e.target)) {
        keyboard = true;
        apply();
      }
    };
    const onFocusOut = () => {
      // defer so moving focus between fields doesn't drop the pin
      window.setTimeout(() => {
        if (!isField(document.activeElement)) {
          keyboard = false;
          apply();
        }
      }, 60);
    };

    el.addEventListener("focusin", onFocusIn);
    el.addEventListener("focusout", onFocusOut);
    vv.addEventListener("resize", apply);
    vv.addEventListener("scroll", apply);
    return () => {
      el.removeEventListener("focusin", onFocusIn);
      el.removeEventListener("focusout", onFocusOut);
      vv.removeEventListener("resize", apply);
      vv.removeEventListener("scroll", apply);
      el.style.height = "";
      el.style.transform = "";
    };
  }, [mode, renderMap]);

  // Ask for the current position once 거리순 is chosen.
  useEffect(() => {
    if (sort !== "distance" || geo || geoDenied) return;
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (p) => setGeo({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => setGeoDenied(true),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 },
    );
  }, [sort, geo, geoDenied]);

  // 거리순: re-order the prefetched list by distance from the user (client-side,
  // since location is only known here). Falls back to the server order until the
  // position resolves (or if it's denied).
  const byDistance = (list: RouteSummary[]) => {
    if (sort !== "distance" || !geo) return list;
    const d = (r: RouteSummary) => {
      const p = r.thumbnailPoints?.[0];
      return p ? haversineKm(geo, p) : Infinity;
    };
    return [...list].sort((a, b) => d(a) - d(b));
  };

  const hasFilters = filterCount(filters) > 0;
  const routes = byDistance(
    (allRoutes ?? []).filter((r) => routeMatchesFilters(r, filters)),
  );

  const renderPanel = () =>
    routes.length === 0 ? (
      <div className="px-4 py-16 text-center text-[14px] text-ink-faint">
        {hasFilters ? (
          <>
            조건에 맞는 루트가 없어요.
            <br />
            <button
              type="button"
              onClick={() => applyFilters(EMPTY_FILTERS)}
              className="mt-3 rounded-full bg-sunset-wash px-4 py-2 text-[13px] font-semibold text-sunset"
            >
              필터 초기화
            </button>
          </>
        ) : q ? (
          <>
            ‘{q}’에 맞는 루트를 찾지 못했어요.
            <br />다른 검색어로 시도해 보세요.
          </>
        ) : (
          <>
            아직 공개된 루트가 없어요.
            <br />첫 번째 공개 루트의 주인공이 되어보세요!
          </>
        )}
      </div>
    ) : (
      <ul className={feedListClass(layout)}>
        {routes.map((r, i) => (
          <li key={r.id}>
            <FeedRouteCard
              route={r}
              layout={layout}
              priority={layout === "grid" ? i < 2 : i === 0}
            />
          </li>
        ))}
      </ul>
    );

  return (
    <>
      {/* 둘러보기 (list) — the conveyor's left pane. Pushed off to the left as the
          map slides in; a sibling (not a child) of the fixed map overlay so the
          overlay's `fixed` isn't trapped by this transform. */}
      <div
        className={`transition-transform ease-[cubic-bezier(0.22,1,0.36,1)] ${
          mapShown ? "-translate-x-full" : "translate-x-0"
        }`}
        style={{
          transitionDuration: `${MAP_SLIDE_MS}ms`,
          transitionDelay: mapShown ? `${MAP_SLIDE_DELAY}ms` : "0ms",
        }}
      >
        {/* Sticky chrome. On scroll-down the block slides up by just the identity
            row's own height (3.5rem) — not the safe area — so the filter toolbar
            parks right BELOW the notch (the notch glass covers the slid-away row).
            Transform only, so it can't feed back into the scroll listener. */}
        <div
          className={`sticky top-0 z-20 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            headerHidden ? "-translate-y-14" : ""
          }`}
        >
          <header
            className={`flex h-[calc(env(safe-area-inset-top)+3.5rem)] items-center gap-2 bg-paper/90 px-3 pt-[env(safe-area-inset-top)] backdrop-blur transition-opacity duration-200 ${
              headerHidden ? "pointer-events-none opacity-0" : ""
            }`}
          >
            {profile ? (
              <button
                type="button"
                onClick={openDiary}
                aria-label={`${profile.displayName}님의 코스`}
                className="flex min-w-0 items-center gap-2 rounded-2xl bg-muted py-1 pl-1 pr-3 ring-1 ring-line/60 transition-transform active:scale-[0.97]"
              >
                <ProfileAvatar profile={profile} />
                <span className="truncate text-[15px] font-bold text-ink">{profile.displayName}</span>
              </button>
            ) : (
              <span className="pl-1 text-[17px] font-black text-ink">둘러보기</span>
            )}
            <div className="ml-auto flex items-center">
              <button
                type="button"
                aria-label="검색"
                onClick={() => setSearchOpen(true)}
                className="flex h-11 w-11 items-center justify-center text-ink-soft"
              >
                <GlassCircle>
                  <SearchIcon />
                </GlassCircle>
              </button>
              <button
                type="button"
                aria-label="설정"
                onClick={() => {
                  if (!requireAuth({ next: "/" })) return;
                  openProfile();
                }}
                className="flex h-11 w-11 items-center justify-center text-ink-soft"
              >
                <GlassCircle>
                  <SettingsIcon />
                </GlassCircle>
              </button>
            </div>
          </header>
          <FeedControls
            q={q}
            sort={sort}
            layout={layout}
            filters={filters}
            onLayoutChange={changeLayout}
            onOpenFilter={() => setFilterOpen(true)}
            onRemoveFilter={removeFilter}
          />
        </div>
        {renderPanel()}
      </div>

      {/* 지도 — the conveyor's right pane, sliding in from off-screen right. */}
      {renderMap && (
        <div
          className={`fixed inset-x-0 top-0 z-40 mx-auto w-full max-w-[430px] transition-transform ease-[cubic-bezier(0.22,1,0.36,1)] ${
            mapShown ? "translate-x-0" : "translate-x-full"
          }`}
          style={{
            transitionDuration: `${MAP_SLIDE_MS}ms`,
            transitionDelay: mapShown ? `${MAP_SLIDE_DELAY}ms` : "0ms",
          }}
        >
          <div ref={overlayRef} className="h-lvh w-full overflow-hidden bg-paper">
            <FeedMap
              key={`${q}|${view}`}
              points={allPoints ?? []}
              q={q}
              view={view}
              filters={filters}
              preferFit={!!q.trim()}
              fullscreen
              detent={mapDetent}
              onDetentChange={setMapDetent}
              onExit={() => router.replace(feedUrl(q, sort, view, "list", filters))}
              sheetHeader={
                <MapTopControls
                  q={q}
                  sort={sort}
                  view={view}
                  filters={filters}
                  detent={mapDetent}
                  onOpenFilter={() => setFilterOpen(true)}
                  onRemoveFilter={removeFilter}
                />
              }
            />
          </div>
        </div>
      )}

      <FeedFilterSheet
        open={filterOpen}
        value={filters}
        countFor={mapActive ? undefined : countFor}
        // 루트 종류(루트일기/계획) only filters the list — map pins are fetched
        // server-side without a purpose join, so hide the facet in 지도 모드.
        showKind={!mapActive}
        onApply={applyFilters}
        onClose={() => setFilterOpen(false)}
      />
      {searchOpen && (
        <FeedSearchOverlay
          q={q}
          sort={sort}
          filters={filters}
          routes={routes}
          onClose={() => setSearchOpen(false)}
        />
      )}

      {/* 내 코스 — client overlay (no /feed navigation → no skeleton flash). */}
      <SlideDrawer
        open={diaryOpen}
        side="left"
        zIndex={50}
        keepAlive={diaryWarm}
        deferBody
        bodyPlaceholder={<DiaryDrawerSkeleton />}
        onSlideInComplete={() => setDiaryWarm(true)}
        onDismiss={closeDiary}
        ariaLabel="내 코스"
        header={
          <header className="flex h-[calc(env(safe-area-inset-top)+3.5rem)] shrink-0 items-center justify-between gap-2 px-3 pt-[env(safe-area-inset-top)]">
            <button
              type="button"
              onClick={closeDiary}
              aria-label="닫기"
              className="flex h-11 w-11 items-center justify-center"
            >
              <GlassCircle>
                <DrawerCloseIcon />
              </GlassCircle>
            </button>
            <div className="flex items-center">
              {notificationBell}
              <button
                type="button"
                onClick={() => {
                  if (!requireAuth({ next: "/" })) return;
                  openProfile();
                }}
                aria-label="설정"
                className="flex h-11 w-11 items-center justify-center text-ink-soft"
              >
                <GlassCircle>
                  <SettingsIcon />
                </GlassCircle>
              </button>
            </div>
          </header>
        }
      >
        {diaryContent}
      </SlideDrawer>

      <SlideDrawer
        open={profileOpen}
        side="right"
        zIndex={60}
        keepAlive={!!profile}
        onDismiss={closeProfile}
        ariaLabel="설정"
        header={
          <header className="flex h-[calc(env(safe-area-inset-top)+3.5rem)] shrink-0 items-center justify-between gap-2 px-3 pt-[env(safe-area-inset-top)]">
            <button
              type="button"
              onClick={closeProfile}
              aria-label="닫기"
              className="flex h-11 w-11 items-center justify-center"
            >
              <GlassCircle>
                <DrawerCloseIcon />
              </GlassCircle>
            </button>
            {profileActions}
          </header>
        }
      >
        {profileDrawer}
      </SlideDrawer>
    </>
  );
}

function feedListClass(layout: FeedLayout) {
  if (layout === "grid") return "grid grid-cols-2 gap-3 px-4 pb-8 pt-4";
  if (layout === "small") return "space-y-2.5 px-4 pb-8 pt-4";
  return "space-y-4 px-4 pb-8 pt-4";
}

/** search + 전체/팔로잉, rendered inside the map sheet's draggable header */
function MapTopControls({
  q,
  sort,
  view,
  filters,
  detent,
  onOpenFilter,
  onRemoveFilter,
}: {
  q: string;
  sort: FeedSortClient;
  view: FeedView;
  filters: FeedFilters;
  /** current sheet detent — the field is a compact affordance at peek and
   *  grows to a comfortable 16px input once raised to medium/top for typing */
  detent: number;
  onOpenFilter: () => void;
  onRemoveFilter: (kind: keyof FeedFilters, value: string) => void;
}) {
  const typing = detent >= 1;
  const router = useRouter();
  const [text, setText] = useState(q);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleTextChange = (val: string) => {
    setText(val);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      router.replace(feedUrl(val, sort, view, "map", filters));
    }, 300);
  };

  const activeCount = filterCount(filters);

  return (
    <div className="space-y-3">
      {/* opaque, lifted field so the search never dissolves into the glass
          sheet behind it — a concrete control sitting on the frosted pill.
          Compact at peek; grows to a comfortable 16px input once the sheet is
          raised for typing. The filter sits inline to its right (no sort on a
          map, so the spot is free). */}
      <div className="flex items-center gap-2">
        <div
          className={`flex flex-1 items-center gap-2 rounded-full border border-line bg-card px-3.5 shadow-[var(--shadow-sm)] transition-all duration-200 ${
            typing ? "py-3" : "-mt-0.5 py-1.5"
          }`}
        >
          <MapSearchIcon />
          <input
            value={text}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder="지역·제목으로 검색"
            className={`w-full bg-transparent text-ink outline-none placeholder:text-ink-faint ${
              typing ? "text-[16px]" : "text-[14px]"
            }`}
          />
          {text && (
            <button
              type="button"
              onClick={() => handleTextChange("")}
              aria-label="지우기"
              className="text-ink-faint"
            >
              <ClearIcon />
            </button>
          )}
        </div>
        <MapFilterButton count={activeCount} typing={typing} onClick={onOpenFilter} />
      </div>
      {activeCount > 0 && (
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {[
            ...filters.themes.map((v) => ["themes", v] as const),
            ...filters.moods.map((v) => ["moods", v] as const),
            ...filters.regions.map((v) => ["regions", v] as const),
          ].map(([kind, value]) => (
            <button
              key={`${kind}:${value}`}
              type="button"
              onClick={() => onRemoveFilter(kind, value)}
              aria-label={`${value} 필터 제거`}
              className="flex shrink-0 items-center gap-1 rounded-full bg-ink py-1.5 pl-3 pr-2 text-[12px] font-semibold text-paper"
            >
              {value}
              <MapChipX />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function MapFilterButton({
  count,
  typing,
  onClick,
}: {
  count: number;
  typing: boolean;
  onClick: () => void;
}) {
  const active = count > 0;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={active ? `필터 ${count}개 적용됨` : "필터"}
      className={`flex shrink-0 items-center gap-1 rounded-full px-3.5 text-[13px] font-bold shadow-[var(--shadow-sm)] transition-all duration-200 ${
        typing ? "py-3" : "-mt-0.5 py-2.5"
      } ${active ? "bg-ink text-paper" : "border border-line bg-card text-ink-soft"}`}
    >
      <MapFilterIcon />
      {active && <span>{count}</span>}
    </button>
  );
}

function MapFilterIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0">
      <path d="M4 7h8M17 7h3M4 17h3M12 17h8" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <circle cx="14.5" cy="7" r="2.3" stroke="currentColor" strokeWidth="1.9" />
      <circle cx="9.5" cy="17" r="2.3" stroke="currentColor" strokeWidth="1.9" />
    </svg>
  );
}

function MapChipX() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.9" />
      <path d="m20 20-3.2-3.2" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

function ProfileAvatar({ profile }: { profile: RouteAuthor }) {
  return profile.avatarUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={profile.avatarUrl} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
  ) : (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sunset text-[13px] font-bold text-white">
      {profile.displayName.charAt(0)}
    </span>
  );
}

function DrawerCloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 6 18 18M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M19.4 13a7.6 7.6 0 0 0 0-2l1.7-1.3-1.9-3.3-2 .8a7.6 7.6 0 0 0-1.7-1l-.3-2.1H9.8l-.3 2.1a7.6 7.6 0 0 0-1.7 1l-2-.8L3.9 9.7 5.6 11a7.6 7.6 0 0 0 0 2l-1.7 1.3 1.9 3.3 2-.8c.5.4 1.1.7 1.7 1l.3 2.1h4.4l.3-2.1c.6-.3 1.2-.6 1.7-1l2 .8 1.9-3.3L19.4 13Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MapSearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0">
      <circle cx="11" cy="11" r="7" stroke="var(--ink-faint)" strokeWidth="1.8" />
      <path d="m20 20-3.2-3.2" stroke="var(--ink-faint)" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function ClearIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="m6 6 12 12M18 6 6 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
