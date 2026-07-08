"use client";

import Image from "next/image";
import Link from "next/link";
import { Fragment, useEffect, useState, useSyncExternalStore } from "react";
import { ViewTransition } from "@/lib/view-transition";
import { clearPendingRoute } from "@/lib/pending-route";
import AppHeader from "@/components/AppHeader";
import JellyButton from "@/components/JellyButton";
import RouteMap, { type MapLeg, type MapSpot } from "@/components/RouteMap";
import RoutePlanThumbnail from "@/components/RoutePlanThumbnail";
import RouteActions from "./RouteActions";
import RouteDetailChromeTone from "./RouteDetailChromeTone";
import RouteHeroMeta from "./RouteHeroMeta";
import CopyRouteButton from "./CopyRouteButton";
import RouteAuthorCard from "./RouteAuthorCard";
import RouteMenu from "./RouteMenu";
import ConvertPlanButton from "./ConvertPlanButton";
import PhotoCarousel from "./PhotoCarousel";
import PhotoLightbox, { type LightboxPhoto } from "./PhotoLightbox";
import { CarIcon, TaxiIcon, BicycleIcon, TrainIcon, BusIcon, FootIcon } from "./LegIcons";
import {
  TRANSPORT_LABEL,
  TRANSPORT_COLOR,
  type Leg,
  type Route,
  type RouteThumbnailPoint,
  type Spot,
  type TransportMode,
} from "@/lib/types";
import type { RouteCopyContext } from "@/lib/data";
import { formatKrw, formatDuration } from "@/lib/format";
import { haversineMeters, formatDistance } from "@/lib/geo";

type Layout = "A" | "B";

type Props = {
  route: Route;
  isOwner: boolean;
  /** server-rendered "지도에서 보기" section, streamed via <Suspense> so the
   *  external directions lookup never blocks the rest of the page. */
  mapSlot?: React.ReactNode;
  lineageSlot?: React.ReactNode;
  copyContext?: RouteCopyContext | null;
};

const ROUTE_LAYOUT_EVENT = "routdiary:route-layout";
const DEFAULT_LAYOUT: Layout = "A";

function readStoredLayout(): Layout {
  if (typeof window === "undefined") return DEFAULT_LAYOUT;
  const saved = window.localStorage.getItem("routeLayout");
  return saved === "A" || saved === "B" ? saved : DEFAULT_LAYOUT;
}

function subscribeRouteLayout(onStoreChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === "routeLayout") onStoreChange();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(ROUTE_LAYOUT_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(ROUTE_LAYOUT_EVENT, onStoreChange);
  };
}

/**
 * Route presentation with two switchable layouts (toggle, top-right):
 *  - A: cover-hero + vertical timeline (the original).
 *  - B: no hero; an Instagram-style feed of per-spot photo carousels with
 *       movement info blocks between consecutive spots.
 */
export default function RouteView({ route, isOwner, mapSlot, lineageSlot, copyContext }: Props) {
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);
  const layout = useSyncExternalStore(
    subscribeRouteLayout,
    readStoredLayout,
    () => DEFAULT_LAYOUT,
  );
  const choose = (v: Layout) => {
    try {
      localStorage.setItem("routeLayout", v);
      window.dispatchEvent(new Event(ROUTE_LAYOUT_EVENT));
    } catch {
      /* ignore */
    }
  };

  const isPlanView = copyContext?.purpose === "plan";
  const spotById = new Map(route.spots.map((spot) => [spot.id, spot]));
  const legByFrom = new Map<string, Leg>();
  route.legs.forEach((l) => legByFrom.set(l.fromSpotId, l));
  const planPoints = routeSpotsToThumbnailPoints(route.spots);
  const planMapSpots: MapSpot[] = planPoints.map((point) => ({
    title: point.title,
    lat: point.lat,
    lng: point.lng,
    label: point.orderIndex + 1,
  }));
  const planMapLegs: MapLeg[] = route.spots.slice(0, -1).flatMap((spot, index) => {
    const next = route.spots[index + 1];
    const leg = legByFrom.get(spot.id);
    if (
      !next ||
      typeof spot.lat !== "number" ||
      typeof spot.lng !== "number" ||
      typeof next.lat !== "number" ||
      typeof next.lng !== "number"
    ) {
      return [];
    }
    return [{
      from: { lat: spot.lat, lng: spot.lng },
      to: { lat: next.lat, lng: next.lng },
      transport: leg?.transport ?? "other",
    }];
  });
  const planDurationMin = route.legs.reduce((sum, leg) => sum + (leg.durationMin ?? 0), 0);
  const planDistanceMeters = route.legs.reduce((sum, leg) => {
    const from = spotById.get(leg.fromSpotId);
    const to = spotById.get(leg.toSpotId);
    if (
      !from ||
      !to ||
      typeof from.lat !== "number" ||
      typeof from.lng !== "number" ||
      typeof to.lat !== "number" ||
      typeof to.lng !== "number"
    ) {
      return sum;
    }
    return sum + haversineMeters({ lat: from.lat, lng: from.lng }, { lat: to.lat, lng: to.lng });
  }, 0);
  const lightboxPhotos: LightboxPhoto[] = [];
  const photoStartBySpotId = new Map<string, number>();
  route.spots.forEach((spot, spotIndex) => {
    photoStartBySpotId.set(spot.id, lightboxPhotos.length);
    spot.photos.forEach((photo) => {
      lightboxPhotos.push({ ...photo, spotTitle: spot.title, spotIndex });
    });
  });

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      clearPendingRoute(route.id);
    }, 700);
    return () => window.clearTimeout(timeout);
  }, [route.id]);

  const coverMorphName = `route-detail-cover-${route.id}`;

  const controls = (onHero: boolean) => (
    <div className="flex items-center gap-1">
      {!isPlanView && <LayoutToggle value={layout} onChange={choose} onHero={onHero} />}
      <RouteMenu
        routeId={route.id}
        title={route.title}
        canShare={route.visibility === "public"}
        isOwner={isOwner}
        onHero={onHero}
      />
    </div>
  );

  const heroMeta = {
    region: route.region,
    title: route.title,
    theme: route.theme,
    mood: route.mood,
    createdAt: route.createdAt,
    author: route.author,
  };

  const followCount = route.copyCount ?? 0;
  const social = !isOwner ? (
    <div className="px-4 pt-4">
      <div className="flex flex-wrap items-center gap-2">
        <RouteActions
          routeId={route.id}
          initialLiked={route.liked ?? false}
          initialLikeCount={route.likeCount}
          initialBookmarked={route.bookmarked ?? false}
        />
        {route.visibility === "public" && followCount > 0 && (
          <span className="ml-auto flex items-center gap-1.5 text-[13px] font-semibold text-sunset-ink">
            <FollowIcon />
            {followCount}명이 따라갔어요
          </span>
        )}
      </div>
      {route.visibility === "public" && (
        <div className="mt-3">
          <CopyRouteButton routeId={route.id} prominent />
        </div>
      )}
    </div>
  ) : null;

  // "이 코스를 쓸 수 있나?"를 한눈에 — 이동 시간·거리·이동수단·스팟·비용 요약.
  const transitLabel = summarizeTransit(route.legs);
  const summaryStats = [
    planDurationMin > 0
      ? { icon: <ClockIcon />, label: formatDuration(planDurationMin) }
      : null,
    planDistanceMeters > 0
      ? { icon: <RulerIcon />, label: formatDistance(planDistanceMeters) }
      : null,
    transitLabel ? { icon: <MoveIcon />, label: transitLabel } : null,
    { icon: <StopIcon />, label: `스팟 ${route.spots.length}` },
    route.estCostKrw
      ? { icon: <WonIcon />, label: formatKrw(route.estCostKrw) }
      : null,
  ].filter((s) => s !== null) as { icon: React.ReactNode; label: string }[];

  const courseSummary =
    route.spots.length > 0 ? (
      <div className="no-scrollbar flex items-center gap-2 overflow-x-auto px-4 pt-4">
        {summaryStats.map((s, i) => (
          <span
            key={i}
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-line bg-card px-3 py-1.5 text-[12.5px] font-semibold text-ink-soft"
          >
            <span className="text-ink-faint">{s.icon}</span>
            {s.label}
          </span>
        ))}
      </div>
    ) : null;

  // a tappable author card → their profile (the discovery → follow entry point)
  const authorCard = !isOwner && route.author.handle ? (
    <div className="px-4 pt-4">
      <RouteAuthorCard author={route.author} />
    </div>
  ) : null;

  const floatingHeader = (
    <>
      <RouteDetailChromeTone />
      <div className="fixed left-1/2 top-0 z-30 h-[calc(env(safe-area-inset-top)+3.5rem)] w-full max-w-[430px] -translate-x-1/2">
        <AppHeader back="/" transparent glass right={controls(true)} />
      </div>
    </>
  );

  // route meta moves to a "여행 정보" footer next to the map (passive reference
  // info → bottom, keeping the hero → journey flow clean up top).
  const hasInfo = !!(route.recommendedFor || route.bestSeason || route.estCostKrw);
  const bottomInfo = hasInfo ? (
    <section className="px-4 pt-7">
      <h2 className="mb-3 text-[16px] font-bold text-ink">여행 정보</h2>
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-card)] border border-line bg-line">
        <Info label="추천 대상" value={route.recommendedFor} wide />
        <Info label="방문 시점" value={route.bestSeason} />
        <Info label="지출 비용" value={formatKrw(route.estCostKrw)} />
      </div>
    </section>
  ) : null;

  if (isPlanView) {
    const planDurationLabel = planDurationMin > 0 ? formatDuration(planDurationMin) : "시간 미정";
    const planDistanceLabel = planDistanceMeters > 0 ? formatDistance(planDistanceMeters) : "거리 계산 전";

    return (
      <>
        {floatingHeader}
        {isOwner && (
          <div className="pointer-events-none fixed left-1/2 top-0 z-40 flex h-[calc(env(safe-area-inset-top)+3.5rem)] w-full max-w-[430px] -translate-x-1/2 items-center justify-center pt-[env(safe-area-inset-top)]">
            <div className="pointer-events-auto">
              <ConvertPlanButton routeId={route.id} />
            </div>
          </div>
        )}
        <div className="relative h-[58vh] min-h-[430px] w-full overflow-hidden bg-line">
          <RoutePlanThumbnail points={planPoints} className="absolute inset-0" />
          <RouteMap
            spots={planMapSpots}
            legs={planMapLegs}
            interactive
            zoomControl={false}
            fullscreenEnabled={false}
            showLegend={false}
            className="absolute inset-0 rounded-none border-0"
            mapClassName="h-full w-full bg-line"
          />
          <div className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-t from-black/80 via-black/20 to-black/25" />
          <div className="absolute left-4 right-4 top-[calc(env(safe-area-inset-top)+4.25rem)] z-[3] flex items-start justify-between gap-3">
            <div className="rounded-2xl bg-card/92 px-3 py-2 shadow-sm ring-1 ring-white/50 backdrop-blur">
              <div className="text-[11px] font-semibold text-ink-faint">지도 위 여행 계획</div>
              <div className="mt-0.5 text-[14px] font-black text-ink">
                스팟 {route.spots.length}곳
                <span className="ml-1 text-[12px] font-semibold text-ink-faint">
                  {planDurationLabel}
                </span>
              </div>
            </div>
            <span className="rounded-full bg-sunset px-3 py-1.5 text-[12px] font-black text-white shadow-sm">
              계획 중
            </span>
          </div>
          <RouteHeroMeta
            meta={heroMeta}
            className="absolute inset-x-0 bottom-0 z-[3] p-4 pb-6 text-white"
          />
        </div>

        {social}
        {authorCard}

        <section className="px-4 pt-5">
          <div className="rounded-[var(--radius-card)] border border-line bg-card p-4 shadow-[var(--shadow-sm)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-[16px] font-black text-ink">계획 기준으로 보기</h2>
                <p className="mt-1 text-[13px] leading-relaxed text-ink-faint">
                  지도에서 전체 동선을 먼저 보고, 스팟과 이동 구간을 조정하는 초안이에요.
                </p>
              </div>
              {copyContext?.original && (
                <Link
                  href={`/routes/${copyContext.original.id}`}
                  className="shrink-0 rounded-full bg-sunset-wash px-3 py-1.5 text-[12px] font-bold text-sunset-ink"
                >
                  원본 보기
                </Link>
              )}
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <PlanMetric label="스팟" value={`${route.spots.length}곳`} />
              <PlanMetric label="이동" value={planDurationLabel} />
              <PlanMetric label="거리" value={planDistanceLabel} />
            </div>
          </div>
        </section>

        <section className="px-4 pt-6">
          <h2 className="text-[16px] font-bold text-ink">
            지도 위 스팟
            <span className="ml-1.5 text-[13px] font-medium text-ink-faint">
              순서대로 확인
            </span>
          </h2>
          <ol className="mt-3 space-y-3">
            {route.spots.map((spot, idx) => {
              const next = route.spots[idx + 1];
              const leg = legByFrom.get(spot.id);
              return (
                <Fragment key={spot.id}>
                  <li key={`${spot.id}-spot`} className="rounded-[var(--radius-card)] border border-line bg-card p-3.5">
                    <div className="flex gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sunset text-[13px] font-black text-white">
                        {idx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-[15px] font-bold text-ink">{spot.title}</h3>
                        {spot.address && (
                          <p className="mt-1 flex items-center gap-1 text-[12px] text-ink-faint">
                            <PinIcon /> <span className="min-w-0 truncate">{spot.address}</span>
                          </p>
                        )}
                        {spot.body && (
                          <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-ink-soft">
                            {spot.body}
                          </p>
                        )}
                      </div>
                    </div>
                  </li>
                  {leg && next && <PlanLegCard key={`${spot.id}-leg`} leg={leg} from={spot} to={next} />}
                </Fragment>
              );
            })}
          </ol>
        </section>

        {bottomInfo}
        {lineageSlot}
        {mapSlot}
      </>
    );
  }

  // ── Layout B: Instagram-style spot feed ───────────────────────────────
  if (layout === "B") {
    const firstSpot = route.spots[0];
    return (
      <>
        {floatingHeader}
        {/* hero = the first spot's photos; the card cover morphs into it */}
        <div className="relative bg-line">
          <PhotoCarousel
            photos={firstSpot?.photos ?? []}
            alt={firstSpot?.title ?? route.title}
            morphName={coverMorphName}
            eagerFirst
            className="route-hero-carousel"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/25" />
          <RouteHeroMeta
            meta={heroMeta}
            passThrough
            className="absolute inset-x-0 bottom-0 p-4 pb-12 text-white"
          />
        </div>

        {courseSummary}
        {social}
        {authorCard}

        <section className="pt-5">
          <h2 className="px-4 text-[16px] font-bold text-ink">
            코스 따라가기
            <span className="ml-1.5 text-[13px] font-medium text-ink-faint">
              스팟 {route.spots.length}곳
            </span>
          </h2>

          <div className="mt-3">
            {route.spots.map((spot, idx) => {
              const next = route.spots[idx + 1];
              const leg = legByFrom.get(spot.id);
              return (
                <Fragment key={spot.id}>
                  <SpotCardB key={`${spot.id}-spot`} spot={spot} index={idx} hideMedia={idx === 0} />
                  {leg && next && <LegInfoB key={`${spot.id}-leg`} leg={leg} from={spot} to={next} />}
                </Fragment>
              );
            })}
          </div>
        </section>

        {bottomInfo}
        {lineageSlot}
        {mapSlot}
      </>
    );
  }

  // ── Layout A: cover hero + timeline (original) ────────────────────────
  const coverImage = route.coverPhotoUrl ? (
    <div className="absolute inset-0 overflow-hidden">
      <Image
        src={route.coverPhotoUrl}
        alt={route.title}
        fill
        sizes="430px"
        className="object-cover"
        loading="eager"
        fetchPriority="high"
      />
    </div>
  ) : null;

  return (
    <>
      {floatingHeader}
      <div className="relative h-[52vh] max-h-[560px] min-h-[300px] w-full bg-line">
        {coverImage ? (
          <ViewTransition name={coverMorphName} share="route-cover-morph">
            {coverImage}
          </ViewTransition>
        ) : (
          coverImage
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/25" />
        <RouteHeroMeta meta={heroMeta} className="absolute inset-x-0 bottom-0 z-[3] p-4 text-white" />
      </div>

      {courseSummary}
      {social}
      {authorCard}

      <section className="px-4 pt-7">
        <h2 className="text-[16px] font-bold text-ink">
          코스 따라가기
          <span className="ml-1.5 text-[13px] font-medium text-ink-faint">
            스팟 {route.spots.length}곳
          </span>
        </h2>

        <ol className="mt-4">
          {route.spots.map((spot, idx) => {
            const leg = legByFrom.get(spot.id);
            const next = route.spots[idx + 1];
            const isLast = idx === route.spots.length - 1;
            return (
              <li key={spot.id}>
                <SpotBlock
                  spot={spot}
                  index={idx}
                  isLast={isLast}
                  photoOffset={photoStartBySpotId.get(spot.id) ?? 0}
                  onPhotoClick={setActivePhotoIndex}
                />
                {leg && next && !isLast && <LegBlock key={`${spot.id}-leg`} leg={leg} from={spot} to={next} />}
              </li>
            );
          })}
        </ol>
      </section>

      {bottomInfo}
      {lineageSlot}
      {mapSlot}
      {activePhotoIndex != null && (
        <PhotoLightbox
          photos={lightboxPhotos}
          initialIndex={activePhotoIndex}
          onClose={() => setActivePhotoIndex(null)}
        />
      )}
    </>
  );
}

function LayoutToggle({
  value,
  onChange,
  onHero,
}: {
  value: Layout;
  onChange: (v: Layout) => void;
  onHero: boolean;
}) {
  const wrap = onHero
    ? "bg-white/45 text-ink-soft ring-1 ring-white/50 shadow-sm backdrop-blur-md dark:bg-black/35 dark:ring-white/20"
    : "bg-card text-ink-faint ring-1 ring-line";
  const active = onHero ? "bg-white text-ink shadow-sm dark:bg-white/20" : "bg-sunset text-white";
  // each option fills its half of the (bigger) pill so the whole control is an
  // easy tap target — no dead padding between A and B
  return (
    <div className={`flex h-9 items-center rounded-full p-1 ${wrap}`} role="group" aria-label="레이아웃 전환">
      {(["A", "B"] as const).map((v) => (
        <JellyButton
          key={v}
          type="button"
          onClick={() => onChange(v)}
          aria-pressed={value === v}
          className={`flex h-7 min-w-[34px] items-center justify-center rounded-full px-2.5 text-[13px] font-bold transition-colors ${
            value === v ? active : ""
          }`}
        >
          {v}
        </JellyButton>
      ))}
    </div>
  );
}

function routeSpotsToThumbnailPoints(spots: Spot[]): RouteThumbnailPoint[] {
  return spots
    .map((spot, index) => ({ spot, index }))
    .filter(({ spot }) => typeof spot.lat === "number" && typeof spot.lng === "number")
    .map(({ spot, index }) => ({
      title: spot.title,
      lat: spot.lat as number,
      lng: spot.lng as number,
      orderIndex: index,
    }));
}

function PlanMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl bg-paper px-2.5 py-2.5">
      <div className="text-[10px] font-semibold text-ink-faint">{label}</div>
      <div className="mt-0.5 truncate text-[13px] font-black text-ink">{value}</div>
    </div>
  );
}

function PlanLegCard({ leg, from, to }: { leg: Leg; from: Spot; to: Spot }) {
  const color = TRANSPORT_COLOR[leg.transport] ?? TRANSPORT_COLOR.other;
  const dist =
    typeof from.lat === "number" &&
    typeof from.lng === "number" &&
    typeof to.lat === "number" &&
    typeof to.lng === "number"
      ? formatDistance(
          haversineMeters(
            { lat: from.lat, lng: from.lng },
            { lat: to.lat, lng: to.lng },
          ),
        )
      : "—";

  return (
    <li className="rounded-[var(--radius-card)] border border-line bg-paper p-3.5">
      <div className="flex gap-3.5">
        <LegMotion mode={leg.transport} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 text-[12px] font-semibold text-ink-faint">
              다음 스팟까지
            </div>
            <span
              className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold"
              style={{ backgroundColor: `${color}18`, color }}
            >
              {TRANSPORT_LABEL[leg.transport]}
            </span>
          </div>
          <div className="mt-1 flex min-w-0 items-center gap-1.5 text-[14px] font-bold text-ink">
            <span className="min-w-0 truncate">{from.title}</span>
            <ArrowSmallIcon />
            <span className="min-w-0 truncate">{to.title}</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <LegMetric label="예상 시간" value={leg.durationMin != null ? formatDuration(leg.durationMin) : "—"} />
            <LegMetric label="직선 거리" value={dist} />
          </div>
          {leg.caution && (
            <p className="mt-3 whitespace-pre-wrap rounded-xl bg-card px-3 py-2 text-[12px] leading-relaxed text-ink-soft">
              {leg.caution}
            </p>
          )}
        </div>
      </div>
    </li>
  );
}

// ── Layout B helpers ────────────────────────────────────────────────────

function SpotCardB({ spot, index, hideMedia }: { spot: Spot; index: number; hideMedia?: boolean }) {
  return (
    <section className="pb-1">
      {!hideMedia && <PhotoCarousel photos={spot.photos} alt={spot.title} />}
      <div className={`px-4 ${hideMedia ? "pt-1" : "pt-3"}`}>
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sunset text-[12px] font-bold text-white">
            {index + 1}
          </span>
          <h3 className="text-[16px] font-bold text-ink">{spot.title}</h3>
        </div>
        {spot.address && (
          <p className="mt-1 flex items-center gap-1 text-[12px] text-ink-faint">
            <PinIcon /> {spot.address}
          </p>
        )}
        {spot.body && (
          <p className="mt-2 whitespace-pre-wrap text-[14px] leading-relaxed text-ink-soft">
            {spot.body}
          </p>
        )}
      </div>
    </section>
  );
}

function LegInfoB({ leg, from, to }: { leg: Leg; from: Spot; to: Spot }) {
  const color = TRANSPORT_COLOR[leg.transport] ?? TRANSPORT_COLOR.other;
  const dist =
    typeof from.lat === "number" &&
    typeof from.lng === "number" &&
    typeof to.lat === "number" &&
    typeof to.lng === "number"
      ? formatDistance(
          haversineMeters(
            { lat: from.lat, lng: from.lng },
            { lat: to.lat, lng: to.lng },
          ),
        )
      : "—";

  return (
    <div className="px-4 py-3">
      <div className="flex gap-3.5 rounded-2xl border border-line bg-card p-4">
        <LegMotion mode={leg.transport} />
        <div className="min-w-0 flex-1">
          <div className="mb-3 text-[12px] font-semibold text-ink-faint">다음 스팟까지 이동</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <LegField label="수단" value={TRANSPORT_LABEL[leg.transport]} accent={color} />
            <LegField label="이동시간" value={leg.durationMin != null ? formatDuration(leg.durationMin) : "—"} />
            <LegField label="거리" value={dist} />
            <LegField label="비용" value="—" />
          </div>
          {leg.caution && (
            <div className="mt-3 border-t border-line pt-3">
              <div className="text-[11px] font-medium text-ink-faint">이동 방법</div>
              <p className="mt-0.5 whitespace-pre-wrap text-[13px] leading-relaxed text-ink-soft">
                {leg.caution}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Vertical dashed path with the transport marker looping top → bottom. */
function LegMotion({ mode }: { mode: TransportMode }) {
  return (
    <div className="relative w-10 shrink-0 self-stretch" aria-hidden>
      <span
        className="absolute bottom-0 left-1/2 top-0 w-[2px] -translate-x-1/2 rounded-full opacity-45"
        style={{ backgroundImage: "repeating-linear-gradient(var(--plan-ink) 0 4px, transparent 4px 9px)" }}
      />
      {/* keep the designed (fixed-palette) leg icons on a light chip so their
          navy/green stays legible in dark mode */}
      <span className="leg-travel absolute inset-x-0 flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.18)] ring-1 ring-black/[0.05]">
        <LegMarker mode={mode} />
      </span>
    </div>
  );
}

/** Picks the mode marker — designed icons per mode. */
function LegMarker({ mode }: { mode: TransportMode }) {
  const cls = "marker-bob h-full w-full";
  switch (mode) {
    case "walk":
      return <FootIcon className={cls} />;
    case "car":
      return <CarIcon className={cls} />;
    case "taxi":
      return <TaxiIcon className={cls} />;
    case "bike":
      return <BicycleIcon className={cls} />;
    case "bus":
      return <BusIcon className={cls} />;
    case "subway":
    case "train":
      return <TrainIcon className={cls} />;
    default:
      // "기타" has no designed icon — simple navy glyph fallback
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#323D50" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          {transportGlyph(mode, "#323D50")}
        </svg>
      );
  }
}

function LegField({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div>
      <div className="text-[11px] font-medium text-ink-faint">{label}</div>
      <div className="mt-0.5 text-[14px] font-semibold" style={{ color: accent ?? "var(--ink)" }}>
        {value}
      </div>
    </div>
  );
}

// ── Layout A helpers ────────────────────────────────────────────────────

function SpotBlock({
  spot,
  index,
  isLast,
  photoOffset,
  onPhotoClick,
}: {
  spot: Spot;
  index: number;
  isLast: boolean;
  photoOffset: number;
  onPhotoClick: (index: number) => void;
}) {
  return (
    <div className="relative pl-9">
      <span className="absolute left-[11px] top-7 bottom-0 w-px bg-line" hidden={isLast} />
      <span className="absolute left-0 top-0 flex h-6 w-6 items-center justify-center rounded-full bg-sunset text-[12px] font-bold text-white">
        {index + 1}
      </span>

      <h3 className="text-[16px] font-bold text-ink">{spot.title}</h3>
      <p className="mt-0.5 flex items-center gap-1 text-[12px] text-ink-faint">
        <PinIcon /> {spot.address}
      </p>

      {spot.photos.length > 0 && (
        <div className="no-scrollbar -mr-4 mt-3 flex gap-2 overflow-x-auto pr-4">
          {spot.photos.map((ph, photoIndex) => (
            <button
              type="button"
              key={ph.id}
              onClick={() => onPhotoClick(photoOffset + photoIndex)}
              aria-label={`${spot.title} 사진 ${photoIndex + 1} 전체화면 보기`}
              className="relative aspect-[4/5] w-36 shrink-0 overflow-hidden rounded-xl bg-line text-left"
            >
              <Image
                src={ph.url}
                alt={ph.alt ?? spot.title}
                fill
                sizes="144px"
                loading={index === 0 && photoIndex === 0 ? "eager" : undefined}
                fetchPriority={index === 0 && photoIndex === 0 ? "high" : undefined}
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}

      <p className="mt-3 whitespace-pre-wrap text-[14px] leading-relaxed text-ink-soft">
        {spot.body}
      </p>
    </div>
  );
}

function LegBlock({ leg, from, to }: { leg: Leg; from: Spot; to: Spot }) {
  const color = TRANSPORT_COLOR[leg.transport] ?? TRANSPORT_COLOR.other;
  const dist =
    typeof from.lat === "number" &&
    typeof from.lng === "number" &&
    typeof to.lat === "number" &&
    typeof to.lng === "number"
      ? formatDistance(
          haversineMeters(
            { lat: from.lat, lng: from.lng },
            { lat: to.lat, lng: to.lng },
          ),
        )
      : "—";

  return (
    <div className="relative my-1 pl-9">
      <span className="absolute left-[11px] top-0 bottom-0 w-px bg-line" />
      <div className="my-3 overflow-hidden rounded-[var(--radius-card)] border border-line bg-card text-[13px] shadow-[var(--shadow-sm)]">
        <div className="flex gap-3.5 p-3.5">
          <LegMotion mode={leg.transport} />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-semibold text-ink-faint">다음 스팟까지 이동</div>
                <div className="mt-1 flex min-w-0 items-center gap-1.5 font-bold text-ink">
                  <span className="min-w-0 truncate">{from.title}</span>
                  <ArrowSmallIcon />
                  <span className="min-w-0 truncate">{to.title}</span>
                </div>
              </div>
              <span
                className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold"
                style={{ backgroundColor: `${color}18`, color }}
              >
                {TRANSPORT_LABEL[leg.transport]}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              <LegMetric label="수단" value={TRANSPORT_LABEL[leg.transport]} accent={color} />
              <LegMetric
                label="시간"
                value={leg.durationMin != null ? formatDuration(leg.durationMin) : "—"}
              />
              <LegMetric label="거리" value={dist} />
            </div>

            <div className="mt-3 rounded-xl bg-paper px-3 py-2">
              <div className="flex items-center gap-2 text-[12px] leading-relaxed text-ink-soft">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="min-w-0 truncate">{transportHint(leg.transport)}</span>
              </div>
            </div>
          </div>
        </div>
        {leg.caution && (
          <div className="border-t border-line bg-sunset-wash/50 px-3.5 py-3">
            <div className="flex gap-2">
              <TipIcon />
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-semibold text-sunset-ink">이동 팁</div>
                <p className="mt-0.5 whitespace-pre-wrap text-[12px] leading-relaxed text-ink-soft">
                  {leg.caution}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LegMetric({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-xl bg-paper px-2.5 py-2">
      <div className="text-[10px] font-semibold text-ink-faint">{label}</div>
      <div className="mt-0.5 truncate text-[13px] font-bold" style={{ color: accent ?? "var(--ink)" }}>
        {value}
      </div>
    </div>
  );
}

function transportHint(mode: TransportMode) {
  switch (mode) {
    case "walk":
      return "걷는 속도로 주변을 함께 둘러보기 좋은 구간";
    case "bike":
      return "자전거로 이어가기 좋은 이동 구간";
    case "car":
    case "taxi":
      return "차량 이동을 염두에 둔 구간";
    case "bus":
    case "subway":
    case "train":
      return "대중교통으로 이어지는 구간";
    default:
      return "직접 메모해 둔 이동 구간";
  }
}

function ArrowSmallIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="shrink-0 text-ink-faint" aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TipIcon() {
  return (
    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-sunset-ink ring-1 ring-sunset/15" aria-hidden>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
        <path d="M12 7v6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="12" cy="17" r="1.2" fill="currentColor" />
        <path d="M12 3 2.8 20h18.4L12 3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

// ── Shared icons ────────────────────────────────────────────────────────

function Info({ label, value, wide }: { label: string; value?: string; wide?: boolean }) {
  return (
    <div className={`bg-card p-3.5 ${wide ? "col-span-2" : ""}`}>
      <div className="text-[11px] font-medium text-ink-faint">{label}</div>
      <div className="mt-0.5 text-[13px] font-medium text-ink">{value || "—"}</div>
    </div>
  );
}

function PinIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="10" r="2.4" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

/** One-line "how do I get around this course?" label from its legs. */
function summarizeTransit(legs: Leg[]): string | null {
  if (!legs.length) return null;
  const modes = new Set(legs.map((l) => l.transport));
  if (modes.has("car") || modes.has("taxi")) return "차량 이동";
  if ([...modes].every((m) => m === "walk")) return "도보 코스";
  if (modes.has("bike")) return "자전거 포함";
  return "뚜벅이 가능";
}

function ClockIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 7.5V12l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RulerIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 15 15 4l5 5L9 20l-5-5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M8 11l1.6 1.6M11 8l1.6 1.6M14 5l1.6 1.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function MoveIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="6" cy="18" r="2.3" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M8.3 18H15a3.5 3.5 0 0 0 0-7H9a3.5 3.5 0 0 1 0-7h3"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeDasharray="0.1 3.2"
      />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="12" cy="10" r="2.2" fill="currentColor" />
    </svg>
  );
}

function WonIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 7l2.5 10L12 8l5.5 9L20 7M3.5 11h17" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FollowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="6" cy="18" r="2.3" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M8.3 18H15a3.5 3.5 0 0 0 0-7H9a3.5 3.5 0 0 1 0-7h3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeDasharray="0.1 3.4"
      />
      <path d="M18 3c-1.6 0-3 1.3-3 2.9 0 2 3 4.5 3 4.5s3-2.5 3-4.5C21 4.3 19.6 3 18 3Z" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function transportGlyph(mode: TransportMode, color: string) {
  switch (mode) {
    case "walk":
      return (
        <g>
          <circle cx="13" cy="4" r="1.8" fill={color} stroke="none" />
          <path d="M12.5 7 9.8 9l.9 3.4L8 18M12.5 7l2.4 1.6 2.8.7M10.7 12.4 13.2 14l1 4" />
        </g>
      );
    case "bike":
      return (
        <g>
          <circle cx="6" cy="16" r="3" />
          <circle cx="18" cy="16" r="3" />
          <path d="M6 16l4-6h4l3.5 6M10 10l1.6 6M9 7h3" />
        </g>
      );
    case "car":
    case "taxi":
      return (
        <g>
          <path d="M4 15v-2.5l2-4.5h12l2 4.5V15M4 15h16M5 15v1.8M19 15v1.8" />
          <circle cx="8" cy="15" r="1" fill={color} stroke="none" />
          <circle cx="16" cy="15" r="1" fill={color} stroke="none" />
        </g>
      );
    case "subway":
    case "train":
      return (
        <g>
          <rect x="6.5" y="3" width="11" height="13" rx="3" />
          <path d="M6.5 11h11M9.5 19l-2 2.5M14.5 19l2 2.5" />
          <circle cx="9.5" cy="13.5" r="1" fill={color} stroke="none" />
          <circle cx="14.5" cy="13.5" r="1" fill={color} stroke="none" />
        </g>
      );
    case "bus":
      return (
        <g>
          <path d="M7 4h10a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm-1 13-1.5 2.5M18 17l1.5 2.5M5 11h14" />
          <circle cx="8.5" cy="14" r="1" fill={color} stroke="none" />
          <circle cx="15.5" cy="14" r="1" fill={color} stroke="none" />
        </g>
      );
    default:
      return <path d="M5 12h13M13 6.5l6 5.5-6 5.5" />;
  }
}
