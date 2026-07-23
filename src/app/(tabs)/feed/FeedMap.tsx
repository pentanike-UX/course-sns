"use client";

import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import BottomSheet from "@/components/BottomSheet";
import JellyButton from "@/components/JellyButton";
import RouteDetailSheet from "./RouteDetailSheet";
import { loadNaverMaps, NAVER_MAP_KEY } from "@/lib/naver";
import type { FeedMapPoint } from "@/lib/data";
import { appendFilterParams, type FeedFilters } from "@/lib/feed-filters";
import { COURSE_STORAGE, readSession, writeSession } from "@/lib/course-storage";
import { courseSpecLine } from "@/lib/course-spec";

type Props = {
  points: FeedMapPoint[];
  q: string;
  view: "all" | "following";
  filters: FeedFilters;
  /** fit the camera to the results (search) instead of restoring the last view */
  preferFit?: boolean;
  /** fill the parent (the fullscreen explore overlay) instead of the inline panel */
  fullscreen?: boolean;
  /** search + segment controls, rendered inside the sheet header (fullscreen) */
  sheetHeader?: ReactNode;
  /** exit back to the list view — shown as a floating button (fullscreen) */
  onExit?: () => void;
  /** controlled sheet detent — lift it to the parent so it survives the
   *  remount when the 전체/팔로잉 segment switches (key changes) */
  detent?: number;
  onDetentChange?: (i: number) => void;
};

// Default view when there are no points: central Seoul.
const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 };

/** markers closer than this (screen px) merge into a numbered cluster */
const CLUSTER_PX = 60;
/** a cluster that still doesn't split here is "co-located" → tap shows a list */
const MAX_SPLIT_ZOOM = 19;
const CAMERA_KEY = COURSE_STORAGE.feedMapCamera;
/** idle → viewport fetch debounce */
const FETCH_DEBOUNCE_MS = 400;

/** Map peek meta: spec parity with list cards + transfer proof (never likes). */
function mapPointMeta(p: FeedMapPoint): string {
  const spec = courseSpecLine({
    durationMin: p.totalDurationMin,
    distanceMeters: p.approxDistanceM,
    transitLabel: p.transitLabel,
    difficulty: p.difficulty,
    region: p.region,
    spotCount: p.spotCount,
  });
  const transfer =
    p.copyCount > 0
      ? `${p.copyCount} 따라감`
      : p.completionCount > 0
        ? `${p.completionCount} 다녀옴`
        : "첫 따라가기";
  return `${spec} · ${transfer}`;
}

type Cluster = { lat: number; lng: number; points: FeedMapPoint[] };
type Camera = { lat: number; lng: number; zoom: number };
type Bounds = { south: number; west: number; north: number; east: number };

// Web Mercator world coordinates (256px base tile), for zoom-aware clustering
const worldX = (lng: number) => ((lng + 180) / 360) * 256;
const worldY = (lat: number) => {
  const s = Math.min(Math.max(Math.sin((lat * Math.PI) / 180), -0.9999), 0.9999);
  return (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * 256;
};

function clusterAtZoom(points: FeedMapPoint[], zoom: number): Cluster[] {
  const scale = 2 ** zoom;
  const buckets = new Map<string, FeedMapPoint[]>();
  for (const p of points) {
    const key = `${Math.floor((worldX(p.lng) * scale) / CLUSTER_PX)}:${Math.floor(
      (worldY(p.lat) * scale) / CLUSTER_PX,
    )}`;
    const bucket = buckets.get(key);
    if (bucket) bucket.push(p);
    else buckets.set(key, [p]);
  }
  const toCluster = (pts: FeedMapPoint[]): Cluster => ({
    lat: pts.reduce((s, p) => s + p.lat, 0) / pts.length,
    lng: pts.reduce((s, p) => s + p.lng, 0) / pts.length,
    points: pts,
  });
  // second pass: grid cells split neighbors at cell boundaries, so greedily
  // merge clusters whose centers still sit within one cluster radius
  const merged: Cluster[] = [];
  for (const c of [...buckets.values()]
    .map(toCluster)
    .sort((a, b) => b.points.length - a.points.length)) {
    const near = merged.find(
      (m) =>
        Math.hypot(
          (worldX(m.lng) - worldX(c.lng)) * scale,
          (worldY(m.lat) - worldY(c.lat)) * scale,
        ) < CLUSTER_PX,
    );
    if (near) {
      const pts = [...near.points, ...c.points];
      Object.assign(near, toCluster(pts));
    } else {
      merged.push(c);
    }
  }
  return merged;
}

const splitsEventually = (points: FeedMapPoint[]) =>
  clusterAtZoom(points, MAX_SPLIT_ZOOM).length > 1;

const loadCamera = (): Camera | null => {
  try {
    const v = readSession(CAMERA_KEY);
    return v ? (JSON.parse(v) as Camera) : null;
  } catch {
    return null;
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const latLngOf = (v: any): { lat: number; lng: number } | null => {
  if (!v) return null;
  const lat = typeof v.lat === "function" ? v.lat() : v.y;
  const lng = typeof v.lng === "function" ? v.lng() : v.x;
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function boundsOf(map: any): Bounds | null {
  try {
    const b = map.getBounds();
    const sw = latLngOf(b.getSW?.() ?? b.getMin?.());
    const ne = latLngOf(b.getNE?.() ?? b.getMax?.());
    if (!sw || !ne || sw.lat >= ne.lat || sw.lng >= ne.lng) return null;
    return { south: sw.lat, west: sw.lng, north: ne.lat, east: ne.lng };
  } catch {
    return null;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pinIcon = (naver: any, p: FeedMapPoint, highlighted: boolean) => {
  const size = highlighted ? 48 : 40;
  const border = highlighted ? "3px solid #ef4444" : "3px solid #fff";
  const thumb = p.coverPhotoUrl
    ? `<img src="${p.coverPhotoUrl}" alt="" style="width:100%;height:100%;object-fit:cover" />`
    : `<div style="width:100%;height:100%;background:#ef4444"></div>`;
  return {
    content: `<div class="rd-mk" style="width:${size}px;height:${size}px;border-radius:50%;overflow:hidden;border:${border};box-shadow:0 2px 8px rgba(0,0,0,.3);cursor:pointer">${thumb}</div>`,
    anchor: new naver.maps.Point(size / 2, size / 2),
  };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const clusterIcon = (naver: any, n: number) => {
  const size = n < 10 ? 38 : n < 30 ? 46 : 54;
  return {
    content: `<div class="rd-mk" style="display:flex;align-items:center;justify-content:center;width:${size}px;height:${size}px;border-radius:50%;background:#ef4444;color:#fff;font-weight:700;font-size:13px;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.3);cursor:pointer">${n}</div>`,
    anchor: new naver.maps.Point(size / 2, size / 2),
  };
};

/**
 * Map view for 둘러보기 — public routes pinned at their first geocoded spot.
 * Nearby pins merge into numbered clusters that split apart as you zoom in;
 * tapping a cluster zooms toward it (or lists its routes when the pins are
 * effectively co-located). A single pin opens a mini card that swipes between
 * nearby routes and overlays the selected course. Panning fetches the routes
 * for the new viewport; the camera persists across toggles per session.
 */
export default function FeedMap({
  points,
  q,
  view,
  filters,
  preferFit = false,
  fullscreen = false,
  sheetHeader,
  onExit,
  detent,
  onDetentChange,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<{ marker: any; point?: FeedMapPoint }[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const polylineRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const geoMarkerRef = useRef<any>(null);

  const [error, setError] = useState<string | null>(null);
  const [pts, setPts] = useState(points);
  const [selected, setSelected] = useState<FeedMapPoint | null>(null);
  /** the routes the mini card cycles through, frozen when the card opens */
  const [tour, setTour] = useState<FeedMapPoint[]>([]);
  const [listGroup, setListGroup] = useState<FeedMapPoint[] | null>(null);
  const [viewportEmpty, setViewportEmpty] = useState(false);
  const [geoMsg, setGeoMsg] = useState<string | null>(null);
  /** routes currently inside the viewport — drives the sheet list (fullscreen) */
  const [visible, setVisible] = useState<FeedMapPoint[]>(points);
  // facets apply in-place (no remount/camera reset): a ref keeps the latest
  // filters for the viewport fetch, and a refetch handle lets a filter change
  // re-pull pins for the current viewport.
  const filtersRef = useRef(filters);
  const refetchRef = useRef<(() => void) | null>(null);
  const filterSig = `${filters.themes}|${filters.moods}|${filters.regions}`;

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  useEffect(() => {
    // re-pull the current viewport when facets change (no-op on mount: the map
    // isn't ready yet, and its idle listener does the first fetch)
    refetchRef.current?.();
  }, [filterSig]);
  /** which sheet detent is active (fullscreen). Controlled by the parent when
   *  it passes onDetentChange, so the height persists across the remount that
   *  the 전체/팔로잉 segment switch triggers; otherwise self-managed. */
  const [detentState, setDetentState] = useState(0);
  const detentIndex = onDetentChange ? (detent ?? 0) : detentState;
  const setDetentIndex = onDetentChange ?? setDetentState;
  /** route whose detail is shown in the stacked sheet (fullscreen map only) */
  const [detail, setDetail] = useState<FeedMapPoint | null>(null);

  const ptsRef = useRef(pts);
  const selectedRef = useRef(selected);
  const rebuildRef = useRef<(force?: boolean) => void>(() => {});

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const listeners: any[] = [];
    let fetchTimer: ReturnType<typeof setTimeout> | undefined;
    let fetchAbort: AbortController | null = null;
    let lastFetchKey = "";

    loadNaverMaps()
      .then(() => {
        if (cancelled || !containerRef.current) return;
        const naver = window.naver;

        const savedCamera = preferFit ? null : loadCamera();
        const map = new naver.maps.Map(containerRef.current, {
          center: new naver.maps.LatLng(
            savedCamera?.lat ?? points[0]?.lat ?? DEFAULT_CENTER.lat,
            savedCamera?.lng ?? points[0]?.lng ?? DEFAULT_CENTER.lng,
          ),
          zoom: savedCamera?.zoom ?? 11,
          scaleControl: false,
          mapDataControl: false,
          logoControlOptions: { position: naver.maps.Position.BOTTOM_LEFT },
        });
        mapRef.current = map;

        const fitTo = (group: FeedMapPoint[]) => {
          if (group.length === 0) return;
          if (group.length === 1) {
            map.setCenter(new naver.maps.LatLng(group[0].lat, group[0].lng));
            map.setZoom(14);
            return;
          }
          const bounds = new naver.maps.LatLngBounds(
            new naver.maps.LatLng(group[0].lat, group[0].lng),
            new naver.maps.LatLng(group[0].lat, group[0].lng),
          );
          group.forEach((p) => bounds.extend(new naver.maps.LatLng(p.lat, p.lng)));
          map.fitBounds(bounds, { top: 56, right: 56, bottom: 96, left: 56 });
        };

        /** routes currently on screen — the mini card cycles through these */
        const viewportPoints = () => {
          try {
            const bounds = map.getBounds();
            const visible = ptsRef.current.filter((p) =>
              bounds.hasLatLng(new naver.maps.LatLng(p.lat, p.lng)),
            );
            return visible;
          } catch {
            return ptsRef.current;
          }
        };

        let builtZoom = -1;
        const rebuildMarkers = (force = false) => {
          const zoom = map.getZoom();
          if (!force && zoom === builtZoom) return;
          builtZoom = zoom;
          markersRef.current.forEach((m) => m.marker.setMap(null));
          markersRef.current = clusterAtZoom(ptsRef.current, zoom).map((c) => {
            if (c.points.length === 1) {
              const p = c.points[0];
              const marker = new naver.maps.Marker({
                position: new naver.maps.LatLng(p.lat, p.lng),
                map,
                title: p.title,
                icon: pinIcon(naver, p, selectedRef.current?.id === p.id),
                zIndex: selectedRef.current?.id === p.id ? 200 : 100,
              });
              naver.maps.Event.addListener(marker, "click", () => {
                setListGroup(null);
                const vis = viewportPoints();
                setTour(vis.some((v) => v.id === p.id) ? vis : [p]);
                setSelected(p);
                // raise to the medium detent so the selected card is visible
                setDetentIndex(1);
                map.panTo(new naver.maps.LatLng(p.lat, p.lng));
              });
              return { marker, point: p };
            }
            const marker = new naver.maps.Marker({
              position: new naver.maps.LatLng(c.lat, c.lng),
              map,
              icon: clusterIcon(naver, c.points.length),
            });
            naver.maps.Event.addListener(marker, "click", () => {
              if (splitsEventually(c.points)) {
                // zooming can break this cluster apart — let the map tell the story
                fitTo(c.points);
              } else {
                // effectively the same place: show the routes instead
                setSelected(null);
                setListGroup(c.points);
                setDetentIndex(1);
                map.panTo(new naver.maps.LatLng(c.lat, c.lng));
              }
            });
            return { marker };
          });
        };
        rebuildRef.current = rebuildMarkers;

        const updateViewportEmpty = () => {
          if (ptsRef.current.length === 0) {
            setViewportEmpty(false);
            return;
          }
          try {
            const bounds = map.getBounds();
            const visible = ptsRef.current.some((p) =>
              bounds.hasLatLng(new naver.maps.LatLng(p.lat, p.lng)),
            );
            setViewportEmpty(!visible);
          } catch {
            setViewportEmpty(false);
          }
        };

        const scheduleViewportFetch = () => {
          clearTimeout(fetchTimer);
          fetchTimer = setTimeout(async () => {
            const b = boundsOf(map);
            if (!b) return;
            // fetch a margin beyond the viewport so small pans don't refetch
            const mLat = (b.north - b.south) * 0.3;
            const mLng = (b.east - b.west) * 0.3;
            const expanded = {
              south: b.south - mLat,
              west: b.west - mLng,
              north: b.north + mLat,
              east: b.east + mLng,
            };
            const f = filtersRef.current;
            const key = [expanded.south, expanded.west, expanded.north, expanded.east]
              .map((v) => v.toFixed(2))
              .concat(`${f.themes}|${f.moods}|${f.regions}`)
              .join(",");
            if (key === lastFetchKey) return;
            lastFetchKey = key;
            fetchAbort?.abort();
            fetchAbort = new AbortController();
            try {
              const params = new URLSearchParams({
                south: String(expanded.south),
                west: String(expanded.west),
                north: String(expanded.north),
                east: String(expanded.east),
                view,
              });
              if (q.trim()) params.set("q", q.trim());
              appendFilterParams(params, f);
              const res = await fetch(`/api/map-points?${params}`, {
                signal: fetchAbort.signal,
              });
              if (!res.ok || cancelled) return;
              const body = (await res.json()) as { points?: FeedMapPoint[] };
              if (Array.isArray(body.points)) setPts(body.points);
            } catch {
              // keep showing what we have — viewport fetch is best-effort
            }
          }, FETCH_DEBOUNCE_MS);
        };
        // let a filter change re-pull the current viewport without a remount
        refetchRef.current = scheduleViewportFetch;

        listeners.push(
          naver.maps.Event.addListener(map, "idle", () => {
            rebuildMarkers();
            updateViewportEmpty();
            setVisible(viewportPoints());
            scheduleViewportFetch();
            try {
              const c = map.getCenter();
              writeSession(
                CAMERA_KEY,
                JSON.stringify({ lat: c.lat(), lng: c.lng(), zoom: map.getZoom() }),
              );
            } catch {
              // private mode etc. — camera memory is best-effort
            }
          }),
          naver.maps.Event.addListener(map, "click", () => {
            setSelected(null);
            setListGroup(null);
          }),
        );

        if (preferFit || !savedCamera) fitTo(points);
        rebuildMarkers();
        setVisible(viewportPoints());
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });

    return () => {
      cancelled = true;
      clearTimeout(fetchTimer);
      fetchAbort?.abort();
      listeners.forEach((l) => window.naver?.maps?.Event?.removeListener?.(l));
      markersRef.current.forEach((m) => m.marker.setMap(null));
      markersRef.current = [];
      polylineRef.current?.setMap(null);
      polylineRef.current = null;
      geoMarkerRef.current?.setMap(null);
      geoMarkerRef.current = null;
      mapRef.current?.destroy?.();
      mapRef.current = null;
    };
    // q/view/points come from the server render; the component remounts per navigation
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // viewport fetch replaced the data set → rebuild markers + refresh the list
  useEffect(() => {
    ptsRef.current = pts;
    if (pts !== points) {
      rebuildRef.current(true);
      const naver = window.naver;
      const map = mapRef.current;
      if (naver?.maps && map) {
        try {
          const bounds = map.getBounds();
          setVisible(pts.filter((p) => bounds.hasLatLng(new naver.maps.LatLng(p.lat, p.lng))));
        } catch {
          setVisible(pts);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pts]);

  // emphasize the selected pin (also reapplied by rebuilds via selectedRef)
  useEffect(() => {
    selectedRef.current = selected;
    const naver = window.naver;
    if (!naver?.maps) return;
    for (const entry of markersRef.current) {
      if (!entry.point) continue;
      const highlighted = selected?.id === entry.point.id;
      entry.marker.setIcon(pinIcon(naver, entry.point, highlighted));
      entry.marker.setZIndex(highlighted ? 200 : 100);
    }
  }, [selected]);

  // overlay the selected route's course
  useEffect(() => {
    const naver = window.naver;
    const map = mapRef.current;
    polylineRef.current?.setMap(null);
    polylineRef.current = null;
    if (!naver?.maps || !map || !selected || selected.path.length < 2) return;
    polylineRef.current = new naver.maps.Polyline({
      map,
      path: selected.path.map((p) => new naver.maps.LatLng(p.lat, p.lng)),
      strokeColor: "#ef4444",
      strokeWeight: 3,
      strokeOpacity: 0.75,
      strokeLineCap: "round",
      strokeLineJoin: "round",
    });
    return () => {
      polylineRef.current?.setMap(null);
      polylineRef.current = null;
    };
  }, [selected]);

  /** tapping a row in the sheet selects it on the map (course + pin) */
  const selectFromList = (p: FeedMapPoint, group: FeedMapPoint[]) => {
    setListGroup(null);
    setTour(group.some((v) => v.id === p.id) ? group : [p]);
    setSelected(p);
    const naver = window.naver;
    if (naver?.maps && mapRef.current) {
      mapRef.current.panTo(new naver.maps.LatLng(p.lat, p.lng));
    }
  };

  const stepTour = (delta: 1 | -1) => {
    if (!selected || tour.length < 2) return;
    const i = tour.findIndex((p) => p.id === selected.id);
    const next = tour[(i + delta + tour.length) % tour.length];
    setSelected(next);
    const naver = window.naver;
    if (naver?.maps && mapRef.current) {
      mapRef.current.panTo(new naver.maps.LatLng(next.lat, next.lng));
    }
  };

  const locateMe = () => {
    const naver = window.naver;
    const map = mapRef.current;
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
        map.setZoom(13);
        map.panTo(at);
      },
      () => setGeoMsg("위치 권한을 확인해 주세요"),
      { timeout: 6000 },
    );
  };

  useEffect(() => {
    if (!geoMsg) return;
    const t = setTimeout(() => setGeoMsg(null), 2500);
    return () => clearTimeout(t);
  }, [geoMsg]);

  if (!NAVER_MAP_KEY) {
    return (
      <MapNotice fullscreen={fullscreen} onExit={onExit}>
        <span>지도 키가 설정되지 않았어요</span>
        <span className="text-[11px]">NEXT_PUBLIC_NAVER_MAP_KEY 설정 후 사용</span>
      </MapNotice>
    );
  }

  if (error) {
    return (
      <MapNotice fullscreen={fullscreen} onExit={onExit}>
        <span>지도를 불러오지 못했어요 ({error})</span>
      </MapNotice>
    );
  }

  const tourIndex = selected ? tour.findIndex((p) => p.id === selected.id) : -1;
  const sheetOpen = !!selected || !!listGroup;
  // keep the notices clear of the top button row (홈/현위치 — ~44px tall,
  // floored at 12px / safe-area from the top), stacking the geo message below
  const chipTop = fullscreen
    ? "top-[calc(max(12px,env(safe-area-inset-top))_+_52px)]"
    : "top-16";
  const chipTop2 = fullscreen
    ? "top-[calc(max(12px,env(safe-area-inset-top))_+_96px)]"
    : "top-[108px]";
  const bottomInset = "bottom-3";
  const bodyList = listGroup ?? visible;

  return (
    <div className={fullscreen ? "relative h-full" : "relative mt-4 flex-1"}>
      <div
        ref={containerRef}
        className={
          fullscreen
            ? "rd-map h-full w-full bg-line"
            : "rd-map h-[calc(100dvh-330px)] min-h-[340px] w-full bg-line"
        }
      />

      {pts.length === 0 ? (
        <div
          className={`pointer-events-none absolute inset-x-4 ${chipTop} z-10 rounded-xl bg-card/90 px-4 py-3 text-center text-[13px] text-ink-faint shadow-[var(--shadow-sm)] backdrop-blur`}
        >
          이 지역엔 좌표가 있는 공개 코스가 아직 없어요
        </div>
      ) : (
        viewportEmpty && (
          <div
            className={`pointer-events-none absolute inset-x-10 ${chipTop} z-10 rounded-full bg-card/90 px-4 py-2 text-center text-[12px] text-ink-faint shadow-[var(--shadow-sm)] backdrop-blur`}
          >
            이 지역엔 아직 공개 코스가 없어요
          </div>
        )
      )}

      {geoMsg && (
        <div
          className={`pointer-events-none absolute inset-x-10 ${chipTop2} z-10 rounded-full bg-card/90 px-4 py-2 text-center text-[12px] text-ink-faint shadow-[var(--shadow-sm)] backdrop-blur`}
        >
          {geoMsg}
        </div>
      )}

      {/* fullscreen: exit + locate float at the top (the sheet owns the bottom) */}
      {fullscreen && (
        <>
          {onExit && (
            <JellyButton
              type="button"
              onClick={onExit}
              aria-label="홈으로"
              className="absolute left-3 top-[max(12px,env(safe-area-inset-top))] z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/40 bg-paper/80 dark:border-white/[0.08] text-ink shadow-[var(--shadow-sm)] backdrop-blur-xl"
            >
              <HomeIcon />
            </JellyButton>
          )}
          <JellyButton
            type="button"
            onClick={locateMe}
            aria-label="내 위치로 이동"
            className="absolute right-3 top-[max(12px,env(safe-area-inset-top))] z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/40 bg-paper/80 dark:border-white/[0.08] text-ink-soft shadow-[var(--shadow-sm)] backdrop-blur-xl"
          >
            <CrosshairIcon />
          </JellyButton>

          <BottomSheet
            detent={detentIndex}
            onDetentChange={setDetentIndex}
            header={sheetHeader}
            peekPx={74}
          >
            <div className="pt-1">
              {selected && (
                <SheetSelectedCard
                  point={selected}
                  index={tourIndex}
                  total={tour.length}
                  onStep={stepTour}
                  onClose={() => setSelected(null)}
                  onOpenDetail={() => setDetail(selected)}
                />
              )}

              <div className="flex items-center justify-between px-1 pb-1.5 pt-2.5">
                <span className="text-[12px] font-semibold text-ink-soft">
                  {listGroup
                    ? `이곳의 코스 ${bodyList.length}`
                    : bodyList.length > 0
                      ? `이 지도 영역 · 코스 ${bodyList.length}`
                      : "둘러보기"}
                </span>
                {listGroup && (
                  <button
                    type="button"
                    onClick={() => setListGroup(null)}
                    className="text-[12px] font-semibold text-sunset"
                  >
                    전체 보기
                  </button>
                )}
              </div>

              {bodyList.length === 0 ? (
                <p className="whitespace-pre-line px-1 py-10 text-center text-[13px] text-ink-faint">
                  {pts.length === 0
                    ? "이 지역엔 좌표가 있는 공개 코스가 아직 없어요"
                    : "이 화면엔 공개 코스가 없어요.\n지도를 움직여 보세요."}
                </p>
              ) : (
                <ul className="space-y-1 pb-2">
                  {bodyList.map((p) => (
                    <li key={p.id}>
                      <SheetRow
                        point={p}
                        active={selected?.id === p.id}
                        onSelect={() => selectFromList(p, bodyList)}
                        onOpenDetail={() => setDetail(p)}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </BottomSheet>

          {detail && (
            <RouteDetailSheet
              key={detail.id}
              id={detail.id}
              preview={detail}
              onClose={() => setDetail(null)}
            />
          )}
        </>
      )}

      {/* inline map: floating locate + bottom card/list overlays */}
      {!fullscreen && (
        <>
          {!sheetOpen && (
            <button
              type="button"
              onClick={locateMe}
              aria-label="내 위치로 이동"
              className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full border border-line bg-card text-ink-soft shadow-[var(--shadow-sm)]"
            >
              <CrosshairIcon />
            </button>
          )}

          {selected && (
            <TourCard
              key={selected.id}
              point={selected}
              index={tourIndex}
              total={tour.length}
              onStep={stepTour}
              bottomInset={bottomInset}
            />
          )}

          {listGroup && (
            <div
              className={`absolute inset-x-3 ${bottomInset} overflow-hidden rounded-2xl border border-line bg-card shadow-[var(--shadow-card)]`}
            >
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="text-[13px] font-bold text-ink">
                  이 지역 코스 {listGroup.length}
                </span>
                <button
                  type="button"
                  onClick={() => setListGroup(null)}
                  aria-label="닫기"
                  className="px-1 text-[13px] text-ink-faint"
                >
                  ✕
                </button>
              </div>
              <ul className="max-h-[34dvh] divide-y divide-line overflow-y-auto overscroll-contain">
                {listGroup.map((p) => (
                  <li key={p.id}>
                    <Link href={`/routes/${p.id}`} className="flex items-center gap-3 p-3">
                      <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-line">
                        {p.coverPhotoUrl && (
                          <Image src={p.coverPhotoUrl} alt="" fill sizes="48px" className="object-cover" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14px] font-bold text-ink">{p.title}</span>
                        <span className="mt-0.5 block truncate text-[12px] text-ink-faint">
                          {mapPointMeta(p)}
                        </span>
                      </span>
                      <span className="text-[13px] font-semibold text-sunset">보기</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/** highlighted card for the route selected on the map (top of the sheet) */
function SheetSelectedCard({
  point,
  index,
  total,
  onStep,
  onClose,
  onOpenDetail,
}: {
  point: FeedMapPoint;
  index: number;
  total: number;
  onStep: (delta: 1 | -1) => void;
  onClose: () => void;
  onOpenDetail: () => void;
}) {
  return (
    <div className="rounded-2xl border border-line bg-card p-3 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-3">
        <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-line">
          {point.coverPhotoUrl && (
            <Image src={point.coverPhotoUrl} alt="" fill sizes="56px" className="object-cover" />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-bold text-ink">{point.title}</span>
          <span className="mt-0.5 block truncate text-[12px] text-ink-faint">
            {mapPointMeta(point)}
          </span>
        </span>
        <JellyButton
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-ink-faint"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </JellyButton>
      </div>
      <div className="mt-2.5 flex items-center gap-2">
        {total > 1 && index >= 0 && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onStep(-1)}
              aria-label="이전 코스"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-ink-soft"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="m15 5-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <span className="min-w-[34px] text-center text-[12px] text-ink-faint">
              {index + 1}/{total}
            </span>
            <button
              type="button"
              onClick={() => onStep(1)}
              aria-label="다음 코스"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-ink-soft"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="m9 5 7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        )}
        <button
          type="button"
          onClick={onOpenDetail}
          className="ml-auto rounded-full bg-sunset px-4 py-2 text-[13px] font-semibold text-white shadow-[var(--shadow-brand)]"
        >
          상세 보기
        </button>
      </div>
    </div>
  );
}

/** a route row in the sheet list — tap selects on the map; 보기 opens detail */
function SheetRow({
  point,
  active,
  onSelect,
  onOpenDetail,
}: {
  point: FeedMapPoint;
  active: boolean;
  onSelect: () => void;
  onOpenDetail: () => void;
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-xl px-2 py-2 transition-colors ${
        active ? "bg-sunset-wash" : ""
      }`}
    >
      <button type="button" onClick={onSelect} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-line">
          {point.coverPhotoUrl && (
            <Image src={point.coverPhotoUrl} alt="" fill sizes="48px" className="object-cover" />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14px] font-bold text-ink">{point.title}</span>
          <span className="mt-0.5 block truncate text-[12px] text-ink-faint">
            {mapPointMeta(point)}
          </span>
        </span>
      </button>
      <button
        type="button"
        onClick={onOpenDetail}
        className="shrink-0 rounded-full bg-muted px-3.5 py-1.5 text-[12px] font-semibold text-ink-soft"
      >
        보기
      </button>
    </div>
  );
}

/** flick on the card commits a step to the prev/next nearby route */
const CARD_LOCK_PX = 10;
const CARD_STEP_PX = 56;

function TourCard({
  point,
  index,
  total,
  onStep,
  bottomInset,
}: {
  point: FeedMapPoint;
  index: number;
  total: number;
  onStep: (delta: 1 | -1) => void;
  bottomInset: string;
}) {
  const cardRef = useRef<HTMLAnchorElement>(null);
  const gestureRef = useRef<{ id: number; x: number; y: number; axis: "h" | "v" | null } | null>(
    null,
  );
  const movedRef = useRef(false);

  const onPointerDown = (e: PointerEvent<HTMLAnchorElement>) => {
    if (e.pointerType !== "touch" || total < 2) return;
    gestureRef.current = { id: e.pointerId, x: e.clientX, y: e.clientY, axis: null };
    movedRef.current = false;
  };

  const onPointerMove = (e: PointerEvent<HTMLAnchorElement>) => {
    const g = gestureRef.current;
    if (!g || e.pointerId !== g.id) return;
    const dx = e.clientX - g.x;
    const dy = e.clientY - g.y;
    if (!g.axis) {
      if (Math.abs(dx) < CARD_LOCK_PX && Math.abs(dy) < CARD_LOCK_PX) return;
      g.axis = Math.abs(dx) > Math.abs(dy) ? "h" : "v";
      if (g.axis === "h") {
        try {
          cardRef.current?.setPointerCapture(e.pointerId);
        } catch {
          // pointer may already be gone
        }
      }
    }
    if (g.axis !== "h") return;
    movedRef.current = true;
    const card = cardRef.current;
    if (card) {
      card.style.transition = "none";
      card.style.transform = `translateX(${dx}px)`;
    }
  };

  const endGesture = (e: PointerEvent<HTMLAnchorElement>, cancelled: boolean) => {
    const g = gestureRef.current;
    if (!g || e.pointerId !== g.id) return;
    gestureRef.current = null;
    const card = cardRef.current;
    if (g.axis !== "h" || !card) return;
    const dx = e.clientX - g.x;
    if (!cancelled && Math.abs(dx) > CARD_STEP_PX) {
      onStep(dx < 0 ? 1 : -1); // remounts via key — no need to reset the transform
    } else {
      card.style.transition = "transform 200ms cubic-bezier(0.22, 1, 0.36, 1)";
      card.style.transform = "translateX(0px)";
    }
  };

  return (
    <Link
      ref={cardRef}
      href={`/routes/${point.id}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={(e) => endGesture(e, false)}
      onPointerCancel={(e) => endGesture(e, true)}
      onClick={(e) => {
        if (movedRef.current) e.preventDefault();
      }}
      className={`tour-card-in absolute inset-x-3 ${bottomInset} flex touch-pan-y items-center gap-3 rounded-2xl border border-line bg-card p-3 shadow-[var(--shadow-card)]`}
    >
      <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-line">
        {point.coverPhotoUrl && (
          <Image src={point.coverPhotoUrl} alt="" fill sizes="56px" className="object-cover" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] font-bold text-ink">{point.title}</span>
        <span className="mt-0.5 block truncate text-[12px] text-ink-faint">
          {mapPointMeta(point)}
        </span>
      </span>
      <span className="flex flex-col items-end gap-1">
        <span className="text-[13px] font-semibold text-sunset">보기</span>
        {total > 1 && index >= 0 && (
          <span className="text-[11px] text-ink-faint">
            {index + 1} / {total}
          </span>
        )}
      </span>
    </Link>
  );
}

/** key-missing / load-error placeholder — keeps an exit in fullscreen */
function MapNotice({
  fullscreen,
  onExit,
  children,
}: {
  fullscreen: boolean;
  onExit?: () => void;
  children: ReactNode;
}) {
  return (
    <div
      className={
        fullscreen
          ? "flex h-full flex-col items-center justify-center gap-3 px-6"
          : "mx-4 mt-4 flex h-60 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-line bg-card px-3"
      }
    >
      <div className="flex flex-col items-center gap-1 text-center text-[12px] text-ink-faint">
        {children}
      </div>
      {fullscreen && onExit && (
        <button
          type="button"
          onClick={onExit}
          className="rounded-full border border-line bg-card px-4 py-2 text-[13px] font-semibold text-ink shadow-[var(--shadow-sm)]"
        >
          홈으로
        </button>
      )}
    </div>
  );
}

function HomeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M3 10.5 12 4l9 6.5M5 9.5V19a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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
