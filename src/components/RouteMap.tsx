"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import BottomSheet from "@/components/BottomSheet";
import JellyButton from "@/components/JellyButton";
import SpotDetailSheet from "@/components/SpotDetailSheet";
import { CarIcon, TaxiIcon, BicycleIcon, TrainIcon, BusIcon, FootIcon } from "@/app/routes/[id]/LegIcons";
import { loadNaverMaps, NAVER_MAP_KEY } from "@/lib/naver";
import { TRANSPORT_LABEL, TRANSPORT_COLOR, type TransportMode } from "@/lib/types";

export type MapSpot = {
  title: string;
  lat: number;
  lng: number;
  label?: string | number;
  /** optional rich detail — when present, tapping the spot opens a detail sheet */
  address?: string;
  body?: string;
  photos?: { id: string; url: string; alt?: string }[];
};

/** One movement between two consecutive located spots. */
export type MapLeg = {
  from: { lat: number; lng: number };
  to: { lat: number; lng: number };
  transport: TransportMode;
  /** Real road geometry as [lng, lat] pairs. Absent → connector only for non-routed modes. */
  path?: [number, number][];
  /** estimated minutes for this movement (for the spot sheet's footer) */
  durationMin?: number;
};

type Props = {
  spots: MapSpot[];
  legs?: MapLeg[];
  className?: string;
  mapClassName?: string;
  interactive?: boolean;
  fullscreenEnabled?: boolean;
  showLegend?: boolean;
  /** show the +/- zoom buttons (defaults to `interactive`) */
  zoomControl?: boolean;
};

const LEG_LINE: Record<TransportMode, { weight: number; style: string }> = {
  walk: { weight: 4, style: "shortdot" },
  bike: { weight: 4, style: "shortdot" },
  car: { weight: 5, style: "solid" },
  taxi: { weight: 5, style: "solid" },
  bus: { weight: 5, style: "solid" },
  subway: { weight: 5, style: "shortdot" },
  train: { weight: 5, style: "shortdot" },
  other: { weight: 4, style: "shortdot" },
};

const LEG_STYLE = (m: TransportMode) => ({
  color: TRANSPORT_COLOR[m] ?? TRANSPORT_COLOR.other,
  ...(LEG_LINE[m] ?? LEG_LINE.other),
});

const ROUTED_MODES: ReadonlySet<TransportMode> = new Set([
  "walk",
  "bike",
  "car",
  "taxi",
  "bus",
  "train",
]);

function shouldUseRoadPath(mode: TransportMode) {
  return ROUTED_MODES.has(mode);
}

function hasUsablePath(leg: MapLeg) {
  return !!leg.path && leg.path.length > 1;
}

function legPathKey(leg: MapLeg, index: number) {
  const lastPathPoint = leg.path?.[leg.path.length - 1];
  const pathKey = hasUsablePath(leg)
    ? `path:${leg.path!.length}:${leg.path![0]?.join(",")}:${lastPathPoint?.join(",")}`
    : "missing";
  return [
    index,
    leg.transport,
    leg.from.lat,
    leg.from.lng,
    leg.to.lat,
    leg.to.lng,
    pathKey,
  ].join(":");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function curvePoints(naver: any, a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const dLat = b.lat - a.lat;
  const dLng = b.lng - a.lng;
  const len = Math.hypot(dLat, dLng) || 1;
  const offset = len * 0.18;
  const cLat = (a.lat + b.lat) / 2 + (-dLng / len) * offset;
  const cLng = (a.lng + b.lng) / 2 + (dLat / len) * offset;
  const N = 24;
  const pts = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const mt = 1 - t;
    pts.push(
      new naver.maps.LatLng(
        mt * mt * a.lat + 2 * mt * t * cLat + t * t * b.lat,
        mt * mt * a.lng + 2 * mt * t * cLng + t * t * b.lng,
      ),
    );
  }
  return pts;
}

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// the app's designed transport icons (same as the route timeline), rendered to
// HTML once per mode for the map traveler
function legIconEl(mode: TransportMode) {
  const cls = "h-full w-full";
  switch (mode) {
    case "walk":
      return <FootIcon className={cls} />;
    case "bike":
      return <BicycleIcon className={cls} />;
    case "car":
      return <CarIcon className={cls} />;
    case "taxi":
      return <TaxiIcon className={cls} />;
    case "bus":
      return <BusIcon className={cls} />;
    case "subway":
    case "train":
      return <TrainIcon className={cls} />;
    default:
      return null;
  }
}

const travelerHtmlCache = new Map<TransportMode, string>();
function travelerHtml(mode: TransportMode): string {
  const cached = travelerHtmlCache.get(mode);
  if (cached) return cached;
  const el = legIconEl(mode);
  const svg = el ? renderToStaticMarkup(el).replace("<svg ", '<svg width="22" height="22" ') : "";
  const inner = svg || '<span style="display:block;width:9px;height:9px;border-radius:50%;background:#dc2626"></span>';
  const html = `<div class="rd-mk" style="display:flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:50%;background:#fff;box-shadow:0 1px 6px rgba(0,0,0,.35)">${inner}</div>`;
  travelerHtmlCache.set(mode, html);
  return html;
}

/**
 * A single transport icon that travels the whole route in order (spot 1 → last
 * spot), swapping to each leg's icon as it enters that leg, then loops.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function startTravelers(naver: any, map: any, legPts: { pts: any[]; transport: TransportMode }[]): () => void {
  const SPEED = 1.1e-6; // degrees per ms (half the previous speed)

  // stitch every leg's points into one continuous path, tracking each segment's
  // transport so the icon can change as the traveler crosses into a new leg
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pts: any[] = [];
  const segMode: TransportMode[] = [];
  for (const leg of legPts) {
    if (!leg.pts || leg.pts.length < 2) continue;
    if (pts.length === 0) pts.push(leg.pts[0]);
    for (let i = 1; i < leg.pts.length; i++) {
      pts.push(leg.pts[i]);
      segMode.push(leg.transport);
    }
  }
  if (pts.length < 2) return () => {};

  const cum = [0];
  let total = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    total += Math.hypot(pts[i + 1].lng() - pts[i].lng(), pts[i + 1].lat() - pts[i].lat());
    cum.push(total);
  }
  if (total === 0) return () => {};

  const duration = Math.min(45000, Math.max(6000, total / SPEED));
  const anchor = new naver.maps.Point(15, 15);
  const marker = new naver.maps.Marker({
    position: pts[0],
    map,
    zIndex: 300,
    icon: { content: travelerHtml(segMode[0]), anchor },
  });
  let shownMode: TransportMode | null = segMode[0];

  let raf = 0;
  const start = performance.now();
  const tick = (now: number) => {
    const d = (((now - start) % duration) / duration) * total;
    let i = 0;
    while (i < pts.length - 2 && cum[i + 1] <= d) i++;
    const mode = segMode[Math.min(i, segMode.length - 1)];
    if (mode !== shownMode) {
      shownMode = mode;
      marker.setIcon({ content: travelerHtml(mode), anchor });
    }
    const segLen = (cum[i + 1] ?? total) - cum[i] || 1;
    const t = (d - cum[i]) / segLen;
    const a = pts[i];
    const b = pts[i + 1] ?? a;
    marker.setPosition(
      new naver.maps.LatLng(a.lat() + (b.lat() - a.lat()) * t, a.lng() + (b.lng() - a.lng()) * t),
    );
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);

  return () => {
    cancelAnimationFrame(raf);
    marker.setMap(null);
  };
}

function renderRoute(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  naver: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  map: any,
  spots: MapSpot[],
  legs: MapLeg[],
  opts?: { onSpotClick?: (i: number) => void; animate?: boolean },
): () => void {
  const onSpotClick = opts?.onSpotClick;
  const points = spots.map((s) => new naver.maps.LatLng(s.lat, s.lng));
  const bounds = new naver.maps.LatLngBounds(points[0], points[0]);
  points.forEach((p: unknown) => bounds.extend(p));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const legPts: { pts: any[]; transport: TransportMode }[] = [];
  legs.forEach((leg) => {
    const style = LEG_STYLE(leg.transport);
    // Routed modes must use real geometry. If the API has not resolved yet (or
    // failed), skip the leg instead of drawing a connector through buildings.
    const pts = hasUsablePath(leg)
      ? leg.path!.map(([lng, lat]) => new naver.maps.LatLng(lat, lng))
      : shouldUseRoadPath(leg.transport)
        ? []
        : curvePoints(naver, leg.from, leg.to);
    if (pts.length < 2) return;
    pts.forEach((p: unknown) => bounds.extend(p));
    new naver.maps.Polyline({
      map,
      path: pts,
      strokeColor: style.color,
      strokeWeight: style.weight,
      strokeStyle: style.style,
      strokeOpacity: 0.9,
      strokeLineCap: "round",
      strokeLineJoin: "round",
    });
    legPts.push({ pts, transport: leg.transport });
  });

  spots.forEach((spot, i) => {
    const label = String(spot.label ?? i + 1).replace(/[<>&"']/g, "");
    const marker = new naver.maps.Marker({
      position: points[i],
      map,
      title: spot.title,
      icon: {
        content: `<div class="rd-mk" style="display:flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:50%;background:#dc2626;color:#fff;font-size:13px;font-weight:700;box-shadow:0 1px 4px rgba(0,0,0,.35);cursor:${onSpotClick ? "pointer" : "default"}">${label}</div>`,
        anchor: new naver.maps.Point(13, 13),
      },
    });
    if (onSpotClick) {
      naver.maps.Event.addListener(marker, "click", () => onSpotClick(i));
    }
  });

  if (points.length > 1) {
    map.fitBounds(bounds, { top: 48, right: 48, bottom: 48, left: 48 });
  }

  if (opts?.animate && !prefersReducedMotion()) {
    return startTravelers(naver, map, legPts);
  }
  return () => {};
}

/**
 * Route overview map. Inline it is static (non-interactive); tapping it opens a
 * fullscreen, interactive map with a "내용 보기" button to return to the detail.
 */
export default function RouteMap({
  spots,
  legs = [],
  className = "",
  mapClassName = "h-52 w-full bg-line",
  interactive = false,
  fullscreenEnabled,
  showLegend = true,
  zoomControl,
}: Props) {
  const showZoom = zoomControl ?? interactive;
  const smallRef = useRef<HTMLDivElement>(null);
  const fullRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fullMapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const geoMarkerRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [fs, setFs] = useState(false);
  const [fsDetent, setFsDetent] = useState(0);
  const [geoMsg, setGeoMsg] = useState<string | null>(null);
  const [detailIndex, setDetailIndex] = useState<number | null>(null);
  // ref so map marker click handlers (bound once on open) always hit the latest
  const openSpotDetailRef = useRef<(i: number) => void>(() => {});
  const canOpenFullscreen = fullscreenEnabled ?? !interactive;
  const resolveKey = useMemo(
    () => legs.map((leg, index) => legPathKey(leg, index)).join("|"),
    [legs],
  );
  const [resolvedPathState, setResolvedPathState] = useState<{
    key: string;
    paths: Record<number, [number, number][]>;
  }>({ key: "", paths: {} });
  const activeResolvedPaths = useMemo(
    () => (resolvedPathState.key === resolveKey ? resolvedPathState.paths : {}),
    [resolvedPathState, resolveKey],
  );
  const resolvedLegs = useMemo(
    () =>
      legs.map((leg, index) => {
        const path = hasUsablePath(leg)
          ? leg.path
          : shouldUseRoadPath(leg.transport)
            ? activeResolvedPaths[index]
            : undefined;
        return path ? { ...leg, path } : leg;
      }),
    [activeResolvedPaths, legs],
  );

  useEffect(() => {
    const missing = legs
      .map((leg, index) => ({ leg, index }))
      .filter(({ leg }) => shouldUseRoadPath(leg.transport) && !hasUsablePath(leg));

    if (missing.length === 0) {
      return;
    }

    const controller = new AbortController();
    const requestKey = resolveKey;

    fetch("/api/directions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        legs: missing.map(({ leg }) => ({
          from: leg.from,
          to: leg.to,
          transport: leg.transport,
        })),
      }),
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((body: { paths?: ([number, number][] | null)[] }) => {
        if (controller.signal.aborted || !Array.isArray(body.paths)) return;
        const next: Record<number, [number, number][]> = {};
        body.paths.forEach((path, i) => {
          if (Array.isArray(path) && path.length > 1) {
            next[missing[i].index] = path;
          }
        });
        setResolvedPathState({ key: requestKey, paths: next });
      })
      .catch(() => {
        if (!controller.signal.aborted) setResolvedPathState({ key: requestKey, paths: {} });
      });

    return () => controller.abort();
  }, [legs, resolveKey]);

  // inline static map
  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let map: any = null;
    let stopAnim: () => void = () => {};
    loadNaverMaps()
      .then(() => {
        if (cancelled || !smallRef.current || spots.length === 0) return;
        const naver = window.naver;
        map = new naver.maps.Map(smallRef.current, {
          center: new naver.maps.LatLng(spots[0].lat, spots[0].lng),
          zoom: 13,
          scaleControl: false,
          mapDataControl: false,
          zoomControl: showZoom,
          zoomControlOptions: showZoom
            ? { position: naver.maps.Position.RIGHT_CENTER }
            : undefined,
          draggable: interactive,
          scrollWheel: interactive,
          pinchZoom: interactive,
          disableDoubleClickZoom: !interactive,
          disableDoubleTapZoom: !interactive,
          disableKineticPan: !interactive,
          keyboardShortcuts: interactive,
        });
        stopAnim = renderRoute(naver, map, spots, resolvedLegs, { animate: true });
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
      stopAnim();
      map?.destroy?.();
    };
  }, [spots, resolvedLegs, interactive, showZoom]);

  // fullscreen interactive map (mounted only while open)
  useEffect(() => {
    if (!fs) return;
    let cancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let map: any = null;
    let stopAnim: () => void = () => {};
    loadNaverMaps()
      .then(() => {
        if (cancelled || !fullRef.current || spots.length === 0) return;
        const naver = window.naver;
        map = new naver.maps.Map(fullRef.current, {
          center: new naver.maps.LatLng(spots[0].lat, spots[0].lng),
          zoom: 14,
          scaleControl: false,
          mapDataControl: false,
          zoomControl: false,
          logoControlOptions: { position: naver.maps.Position.BOTTOM_LEFT },
        });
        fullMapRef.current = map;
        stopAnim = renderRoute(naver, map, spots, resolvedLegs, {
          onSpotClick: (i) => openSpotDetailRef.current(i),
          animate: true,
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      stopAnim();
      geoMarkerRef.current?.setMap(null);
      geoMarkerRef.current = null;
      fullMapRef.current = null;
      map?.destroy?.();
    };
  }, [fs, spots, resolvedLegs]);

  // transient geolocation message
  useEffect(() => {
    if (!geoMsg) return;
    const t = setTimeout(() => setGeoMsg(null), 2500);
    return () => clearTimeout(t);
  }, [geoMsg]);

  const locateMe = () => {
    const naver = window.naver;
    const map = fullMapRef.current;
    if (!naver?.maps || !map) return;
    if (!navigator.geolocation) {
      setGeoMsg("이 기기에서 위치를 사용할 수 없어요");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const at = new naver.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
        geoMarkerRef.current?.setMap(null);
        geoMarkerRef.current = new naver.maps.Marker({
          position: at,
          map,
          icon: {
            content:
              '<div class="rd-mk" style="width:16px;height:16px;border-radius:50%;background:#3b82f6;border:3px solid #fff;box-shadow:0 0 0 4px rgba(59,130,246,.25)"></div>',
            anchor: new naver.maps.Point(8, 8),
          },
        });
        map.setZoom(14);
        map.panTo(at);
      },
      () => setGeoMsg("위치 권한을 확인해 주세요"),
      { timeout: 6000 },
    );
  };

  // Center the spot within the visible map band (the area ABOVE the medium
  // detail sheet), so the pin isn't hidden under the sheet. The sheet's top is
  // at 40% (see SpotDetailSheet), so the visible band is the top 40%; shift the
  // map center south by (0.5 - 0.40/2) = 0.30 of the lat span to raise the spot
  // to the middle of that band.
  const centerSpot = (i: number) => {
    const naver = window.naver;
    const map = fullMapRef.current;
    if (!naver?.maps || !map) return;
    const s = spots[i];
    try {
      const b = map.getBounds();
      const ne = b.getNE?.() ?? b.getMax?.();
      const sw = b.getSW?.() ?? b.getMin?.();
      const latSpan = ne.lat() - sw.lat();
      map.panTo(new naver.maps.LatLng(s.lat - latSpan * 0.3, s.lng));
    } catch {
      map.panTo(new naver.maps.LatLng(s.lat, s.lng));
    }
  };

  const openSpotDetail = (i: number) => {
    centerSpot(i);
    setDetailIndex(i);
  };
  // keep the ref pointed at the latest closure (marker handlers bind it once)
  useEffect(() => {
    openSpotDetailRef.current = openSpotDetail;
  });

  const openFullscreen = () => {
    setFsDetent(0);
    setDetailIndex(null);
    setFs(true);
  };

  if (!NAVER_MAP_KEY || error) return null;

  const modes = Array.from(new Set(legs.map((l) => l.transport)));

  return (
    <>
      <div className={`overflow-hidden rounded-[var(--radius-card)] border border-line ${className}`}>
        <div className="relative h-full">
          <div ref={smallRef} className={`rd-map ${mapClassName ?? ""}`} />
          {canOpenFullscreen && (
            <>
              {/* tap layer → fullscreen (map itself is non-interactive) */}
              <button
                type="button"
                onClick={openFullscreen}
                aria-label="지도 전체화면으로 보기"
                className="absolute inset-0"
              />
              <span className="pointer-events-none absolute right-2.5 top-2.5 flex items-center gap-1 rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur">
                <ExpandIcon /> 전체화면
              </span>
            </>
          )}
        </div>
        {showLegend && modes.length > 0 && (
          <div className="flex flex-wrap gap-x-3 gap-y-1.5 bg-card px-3 py-2">
            {modes.map((m) => {
              const s = LEG_STYLE(m);
              return (
                <span key={m} className="flex items-center gap-1.5 text-[11px] text-ink-soft">
                  <span
                    className="inline-block h-0.5 w-5 rounded-full"
                    style={{
                      backgroundColor: s.color,
                      ...(s.style !== "solid"
                        ? {
                            backgroundImage: `repeating-linear-gradient(90deg, ${s.color} 0 4px, transparent 4px 7px)`,
                            backgroundColor: "transparent",
                          }
                        : {}),
                    }}
                  />
                  {TRANSPORT_LABEL[m]}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {canOpenFullscreen && fs && (
        <div className="fixed inset-0 z-50 flex justify-center overflow-hidden bg-paper">
          <div className="relative h-full w-full">
            <div ref={fullRef} className="rd-map h-full w-full bg-line" />

            {/* unified fullscreen controls (mirrors the explore map) */}
            <JellyButton
              type="button"
              onClick={() => setFs(false)}
              aria-label="내용 보기"
              className="absolute left-3 top-[max(12px,env(safe-area-inset-top))] z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/40 bg-paper/80 text-ink shadow-[var(--shadow-sm)] backdrop-blur-xl dark:border-white/[0.08]"
            >
              <BackIcon />
            </JellyButton>
            <JellyButton
              type="button"
              onClick={locateMe}
              aria-label="내 위치로 이동"
              className="absolute right-3 top-[max(12px,env(safe-area-inset-top))] z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/40 bg-paper/80 text-ink-soft shadow-[var(--shadow-sm)] backdrop-blur-xl dark:border-white/[0.08]"
            >
              <CrosshairIcon />
            </JellyButton>

            {geoMsg && (
              <div className="pointer-events-none absolute inset-x-10 top-[max(64px,calc(env(safe-area-inset-top)+52px))] z-10 rounded-full bg-card/90 px-4 py-2 text-center text-[12px] text-ink-faint shadow-[var(--shadow-sm)] backdrop-blur">
                {geoMsg}
              </div>
            )}

            <BottomSheet
              detent={fsDetent}
              onDetentChange={setFsDetent}
              peekPx={72}
              header={
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[14px] font-bold text-ink">
                    경로 스팟 {spots.length}
                  </span>
                  {modes.length > 0 && (
                    <span className="flex flex-wrap items-center justify-end gap-x-2.5 gap-y-1">
                      {modes.map((m) => {
                        const s = LEG_STYLE(m);
                        return (
                          <span key={m} className="flex items-center gap-1 text-[11px] text-ink-soft">
                            <span
                              className="inline-block h-0.5 w-4 rounded-full"
                              style={{ backgroundColor: s.color }}
                            />
                            {TRANSPORT_LABEL[m]}
                          </span>
                        );
                      })}
                    </span>
                  )}
                </div>
              }
            >
              <ul className="space-y-1 pb-2 pt-1">
                {spots.map((s, i) => (
                  <li key={`${s.lat}-${s.lng}-${i}`}>
                    <button
                      type="button"
                      onClick={() => openSpotDetail(i)}
                      className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors active:bg-muted"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sunset text-[11px] font-bold text-white">
                        {String(s.label ?? i + 1)}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[14px] font-medium text-ink">
                        {s.title}
                      </span>
                      <svg className="shrink-0 text-ink-faint" width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="m9 5 7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            </BottomSheet>

            {detailIndex !== null && (
              <SpotDetailSheet
                spots={spots}
                legs={legs}
                initialIndex={detailIndex}
                onActiveChange={(i) => centerSpot(i)}
                onClose={() => setDetailIndex(null)}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}

function ExpandIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 5-7 7 7 7" />
    </svg>
  );
}

function CrosshairIcon() {
  return (
    <svg width="27" height="27" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="6.5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="2.2" fill="currentColor" />
      <path
        d="M12 1.8v2.6M12 19.6v2.6M1.8 12h2.6M19.6 12h2.6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
