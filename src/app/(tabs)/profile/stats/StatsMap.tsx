"use client";

import { useEffect, useRef, useState } from "react";
import { loadNaverMaps, NAVER_MAP_KEY } from "@/lib/naver";

type Props = { points: { lat: number; lng: number }[] };

/** All of my geocoded spots as small green dots — the "내 여행 지도". */
export default function StatsMap({ points }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    loadNaverMaps()
      .then(() => {
        if (cancelled || !containerRef.current || points.length === 0) return;
        const naver = window.naver;

        const map = new naver.maps.Map(containerRef.current, {
          center: new naver.maps.LatLng(points[0].lat, points[0].lng),
          zoom: 11,
          scaleControl: false,
          mapDataControl: false,
          logoControlOptions: { position: naver.maps.Position.BOTTOM_LEFT },
        });
        mapRef.current = map;

        markersRef.current = points.map(
          (p) =>
            new naver.maps.Marker({
              position: new naver.maps.LatLng(p.lat, p.lng),
              map,
              icon: {
                content:
                  '<div class="rd-mk" style="width:14px;height:14px;border-radius:50%;background:#ef4444;border:2.5px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35)"></div>',
                anchor: new naver.maps.Point(7, 7),
              },
            }),
        );

        if (points.length > 1) {
          const bounds = new naver.maps.LatLngBounds(
            new naver.maps.LatLng(points[0].lat, points[0].lng),
            new naver.maps.LatLng(points[0].lat, points[0].lng),
          );
          points.forEach((p) => bounds.extend(new naver.maps.LatLng(p.lat, p.lng)));
          map.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });
        } else {
          map.setZoom(13);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });

    return () => {
      cancelled = true;
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];
      mapRef.current?.destroy?.();
      mapRef.current = null;
    };
    // server-provided points; remounts per navigation
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!NAVER_MAP_KEY || error) {
    return (
      <div className="flex h-52 items-center justify-center rounded-[var(--radius-card)] border border-dashed border-line bg-card px-3 text-center text-[12px] text-ink-faint">
        {error ? `지도를 불러오지 못했어요 (${error})` : "지도 키가 설정되지 않았어요"}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[var(--radius-card)] border border-line">
      <div ref={containerRef} className="rd-map h-64 w-full bg-line" />
    </div>
  );
}
