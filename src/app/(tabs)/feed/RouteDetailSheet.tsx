"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import RouteMap, { type MapLeg, type MapSpot } from "@/components/RouteMap";
import JellyButton from "@/components/JellyButton";
import { TRANSPORT_LABEL, type Leg, type Route } from "@/lib/types";
import { formatKrw, formatDate, formatDuration } from "@/lib/format";
import type { FeedMapPoint } from "@/lib/data";

/**
 * Route detail presented as a sheet that slides up from off-screen over the
 * explore map's search sheet (a stacked-sheet pattern). Drag the grabber — or
 * pull the body down at the top — to dismiss; it slides back off-screen. A
 * `preview` (the map point already in hand) fills the header instantly while
 * the full route streams in from /api/routes/[id].
 */

const SPRING = "cubic-bezier(0.32, 0.72, 0, 1)";
const ENTER = `transform 0.44s ${SPRING}`;
/** drag distance (or downward flick) past which release dismisses */
const DISMISS_PX = 120;

export default function RouteDetailSheet({
  id,
  preview,
  onClose,
}: {
  id: string;
  preview?: FeedMapPoint | null;
  onClose: () => void;
}) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [route, setRoute] = useState<Route | null>(null);
  const [error, setError] = useState(false);
  const closingRef = useRef(false);
  const drag = useRef<{ y: number; last: number; t: number; v: number; pid?: number } | null>(null);

  // enter: mount off-screen, then slide up on the next frame
  useEffect(() => {
    const sheet = sheetRef.current;
    const scrim = scrimRef.current;
    if (!sheet) return;
    sheet.style.transform = "translateY(100%)";
    if (scrim) scrim.style.opacity = "0";
    const raf = requestAnimationFrame(() => {
      sheet.style.transition = ENTER;
      sheet.style.transform = "translateY(0)";
      if (scrim) {
        scrim.style.transition = "opacity 0.44s ease";
        scrim.style.opacity = "1";
      }
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  // fetch on mount — the parent keys this component by id, so a different
  // route mounts a fresh sheet rather than mutating state in place
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/routes/${id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((b: { route: Route }) => {
        if (!cancelled) setRoute(b.route);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const close = () => {
    if (closingRef.current) return;
    closingRef.current = true;
    const sheet = sheetRef.current;
    const scrim = scrimRef.current;
    if (scrim) {
      scrim.style.transition = "opacity 0.36s ease";
      scrim.style.opacity = "0";
    }
    if (!sheet) {
      onClose();
      return;
    }
    sheet.style.transition = ENTER;
    sheet.style.transform = "translateY(100%)";
    const done = () => {
      sheet.removeEventListener("transitionend", done);
      onClose();
    };
    sheet.addEventListener("transitionend", done);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── shared drag core (header pointer + body pull) ──
  const begin = (clientY: number) => {
    drag.current = { y: clientY, last: clientY, t: performance.now(), v: 0 };
    const sheet = sheetRef.current;
    if (sheet) sheet.style.transition = "none";
  };
  const move = (clientY: number) => {
    const d = drag.current;
    const sheet = sheetRef.current;
    if (!d || !sheet) return;
    const now = performance.now();
    const dt = now - d.t;
    if (dt > 0) d.v = (clientY - d.last) / dt;
    d.last = clientY;
    d.t = now;
    let dy = clientY - d.y;
    if (dy < 0) dy *= 0.3; // resist dragging up past the rest position
    sheet.style.transform = `translateY(${dy}px)`;
    const scrim = scrimRef.current;
    if (scrim) scrim.style.opacity = String(Math.max(0, 1 - dy / 520));
  };
  const finish = (clientY: number) => {
    const d = drag.current;
    const sheet = sheetRef.current;
    if (!d || !sheet) return;
    drag.current = null;
    const dy = clientY - d.y;
    if (dy > DISMISS_PX || d.v > 0.5) {
      close();
      return;
    }
    sheet.style.transition = ENTER;
    sheet.style.transform = "translateY(0)";
    const scrim = scrimRef.current;
    if (scrim) {
      scrim.style.transition = "opacity 0.3s ease";
      scrim.style.opacity = "1";
    }
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button, a, [data-no-drag]")) return;
    begin(e.clientY);
    if (drag.current) drag.current.pid = e.pointerId;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (drag.current?.pid !== e.pointerId) return;
    move(e.clientY);
  };
  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (drag.current?.pid !== e.pointerId) return;
    finish(e.clientY);
  };

  // body pull-to-dismiss: only when the scroll is already at the top
  useEffect(() => {
    const body = bodyRef.current;
    if (!body) return;
    let mode: "idle" | "scroll" | "sheet" = "idle";
    let sy = 0;
    const ts = (e: TouchEvent) => {
      if (e.touches.length !== 1) {
        mode = "scroll";
        return;
      }
      sy = e.touches[0].clientY;
      mode = "idle";
    };
    const tm = (e: TouchEvent) => {
      const y = e.touches[0].clientY;
      if (mode === "idle") {
        if (body.scrollTop <= 0 && y - sy > 2) {
          mode = "sheet";
          begin(sy);
        } else {
          mode = "scroll";
        }
      }
      if (mode === "sheet") {
        e.preventDefault();
        move(y);
      }
    };
    const te = (e: TouchEvent) => {
      if (mode === "sheet") finish(e.changedTouches[0]?.clientY ?? sy);
      mode = "idle";
    };
    body.addEventListener("touchstart", ts, { passive: true });
    body.addEventListener("touchmove", tm, { passive: false });
    body.addEventListener("touchend", te);
    body.addEventListener("touchcancel", te);
    return () => {
      body.removeEventListener("touchstart", ts);
      body.removeEventListener("touchmove", tm);
      body.removeEventListener("touchend", te);
      body.removeEventListener("touchcancel", te);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const title = route?.title ?? preview?.title ?? "";
  const region = route?.region ?? preview?.region ?? "";
  const cover = route?.coverPhotoUrl ?? preview?.coverPhotoUrl;

  const located = (route?.spots ?? []).filter(
    (s) => typeof s.lat === "number" && typeof s.lng === "number",
  );
  const mapSpots: MapSpot[] = located.map((s) => ({
    title: s.title,
    lat: s.lat as number,
    lng: s.lng as number,
    label: s.orderIndex + 1,
    address: s.address,
    body: s.body,
    photos: s.photos,
  }));
  const legByFrom = new Map<string, Leg>();
  route?.legs.forEach((l) => legByFrom.set(l.fromSpotId, l));
  const mapLegs: MapLeg[] = located.slice(0, -1).map((a, i) => {
    const b = located[i + 1];
    const leg = legByFrom.get(a.id);
    return {
      from: { lat: a.lat as number, lng: a.lng as number },
      to: { lat: b.lat as number, lng: b.lng as number },
      transport: leg?.transport ?? "other",
      durationMin: leg?.durationMin,
    };
  });

  return (
    <>
      <div
        ref={scrimRef}
        onClick={close}
        className="absolute inset-0 z-30 bg-black/30"
        aria-hidden
      />
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal
        aria-label={title || "루트 상세"}
        className="absolute inset-x-0 bottom-0 top-[max(40px,env(safe-area-inset-top))] z-40 flex flex-col overflow-hidden rounded-t-[24px] bg-paper shadow-[0_-8px_40px_rgba(0,0,0,0.22)] will-change-transform"
      >
        {/* drag zone: grabber floats above the title row, mirroring the search sheet */}
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="relative shrink-0 cursor-grab touch-none px-5 pb-2 pt-5 active:cursor-grabbing"
        >
          <div className="absolute left-1/2 top-2 h-1 w-9 -translate-x-1/2 rounded-full bg-ink-faint/45" />
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-[18px] font-bold text-ink">{title || " "}</h2>
              {region && <p className="mt-0.5 truncate text-[13px] text-ink-faint">{region}</p>}
            </div>
            <JellyButton
              type="button"
              onClick={close}
              aria-label="닫기"
              data-no-drag
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-ink-faint"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </JellyButton>
          </div>
        </div>

        <div
          ref={bodyRef}
          className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain pb-[max(20px,env(safe-area-inset-bottom))]"
        >
          {cover && (
            <div className="relative mx-4 mt-1 aspect-[16/10] overflow-hidden rounded-2xl bg-line">
              <Image src={cover} alt="" fill sizes="430px" className="object-cover" />
            </div>
          )}

          {error ? (
            <div className="px-5 py-16 text-center text-[14px] text-ink-faint">
              루트를 불러오지 못했어요.
              <div className="mt-3">
                <Link
                  href={`/routes/${id}`}
                  className="inline-block rounded-full bg-sunset px-4 py-2 text-[13px] font-semibold text-white"
                >
                  전체 페이지에서 보기
                </Link>
              </div>
            </div>
          ) : !route ? (
            <DetailSkeleton />
          ) : (
            <>
              <div className="flex items-center gap-2.5 px-5 pt-4">
                <Avatar author={route.author} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-ink">
                    {route.author.displayName}
                  </p>
                  <p className="text-[11px] text-ink-faint">{formatDate(route.createdAt)}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-5 pt-3 text-[12px] text-ink-faint">
                <span>스팟 {route.spots.length}</span>
                <span>♥ {route.likeCount}</span>
                <span>댓글 {route.commentCount}</span>
                {typeof route.estCostKrw === "number" && route.estCostKrw > 0 && (
                  <span>{formatKrw(route.estCostKrw)}</span>
                )}
              </div>

              {(route.theme || route.mood || route.recommendedFor || route.bestSeason) && (
                <div className="flex flex-wrap gap-1.5 px-5 pt-3">
                  {[route.theme, route.mood, route.recommendedFor, route.bestSeason]
                    .filter(Boolean)
                    .map((chip, i) => (
                      <span
                        key={i}
                        className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-ink-soft"
                      >
                        {chip}
                      </span>
                    ))}
                </div>
              )}

              {mapSpots.length > 0 && (
                <RouteMap
                  spots={mapSpots}
                  legs={mapLegs}
                  className="mx-4 mt-4"
                  mapClassName="h-52 rounded-2xl"
                  interactive={false}
                  fullscreenEnabled
                  showLegend={false}
                />
              )}

              <ol className="mt-5 px-5">
                {route.spots.map((spot, i) => {
                  const leg = legByFrom.get(spot.id);
                  return (
                    <li key={spot.id} className="relative pb-5 pl-7 last:pb-0">
                      {i < route.spots.length - 1 && (
                        <span className="absolute left-[9px] top-6 bottom-0 w-px bg-line" />
                      )}
                      <span className="absolute left-0 top-0.5 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-sunset text-[10px] font-bold text-white">
                        {spot.orderIndex + 1}
                      </span>
                      <h3 className="text-[15px] font-bold text-ink">{spot.title}</h3>
                      {spot.address && (
                        <p className="mt-0.5 text-[12px] text-ink-faint">{spot.address}</p>
                      )}
                      {spot.body && (
                        <p className="mt-1.5 whitespace-pre-wrap text-[13px] leading-relaxed text-ink-soft">
                          {spot.body}
                        </p>
                      )}
                      {spot.photos.length > 0 && (
                        <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto">
                          {spot.photos.map((photo) => (
                            <span
                              key={photo.id}
                              className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-line"
                            >
                              <Image
                                src={photo.url}
                                alt={photo.alt ?? ""}
                                fill
                                sizes="112px"
                                className="object-cover"
                              />
                            </span>
                          ))}
                        </div>
                      )}
                      {leg && i < route.spots.length - 1 && (
                        <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-medium text-ink-faint">
                          <span className="h-1 w-1 rounded-full bg-ink-faint/60" />
                          {TRANSPORT_LABEL[leg.transport]}
                          {typeof leg.durationMin === "number" && leg.durationMin > 0 && (
                            <span>· {formatDuration(leg.durationMin)}</span>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ol>

              <div className="px-5 pt-6">
                <Link
                  href={`/routes/${route.id}`}
                  className="block rounded-full bg-sunset py-3 text-center text-[14px] font-semibold text-white shadow-[var(--shadow-brand)]"
                >
                  전체 페이지에서 보기
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

function Avatar({ author }: { author: { displayName: string; avatarUrl?: string } }) {
  return (
    <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-sunset-wash">
      {author.avatarUrl ? (
        <Image src={author.avatarUrl} alt={author.displayName} fill sizes="32px" className="object-cover" />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-[13px] font-bold text-sunset">
          {author.displayName.charAt(0)}
        </span>
      )}
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="animate-pulse px-5 pt-4">
      <div className="flex items-center gap-2.5">
        <div className="h-8 w-8 rounded-full bg-line" />
        <div className="space-y-1.5">
          <div className="h-3 w-24 rounded bg-line" />
          <div className="h-2.5 w-16 rounded bg-line" />
        </div>
      </div>
      <div className="mt-5 h-52 rounded-2xl bg-line" />
      <div className="mt-5 space-y-3">
        <div className="h-4 w-2/3 rounded bg-line" />
        <div className="h-3 w-full rounded bg-line" />
        <div className="h-3 w-5/6 rounded bg-line" />
      </div>
    </div>
  );
}
