"use client";

import { useEffect, useRef, useState } from "react";
import { loadNaverMaps, reverseGeocode, NAVER_MAP_KEY } from "@/lib/naver";

export type PickedLocation = {
  lat: number;
  lng: number;
  address?: string;
  /** Set when the location came from a keyword search result (place name). */
  place?: string;
};

type Props = {
  lat?: number;
  lng?: number;
  /** Whether the keyword place-search proxy (/api/places) is configured. */
  searchEnabled?: boolean;
  /** Fired when the user taps the map, drags the pin, or picks a search hit. */
  onPick: (loc: PickedLocation) => void;
};

type PlaceHit = {
  name: string;
  category: string;
  address: string;
  lat: number;
  lng: number;
};

// Default view: central Seoul. The pin only appears once the user picks.
const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 };

/**
 * A compact map where the user taps (or drags the pin) to set a spot's
 * coordinates. On pick we reverse-geocode to suggest an address.
 */
export default function SpotLocationPicker({ lat, lng, searchEnabled, onPick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markerRef = useRef<any>(null);
  const onPickRef = useRef(onPick);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onPickRef.current = onPick;
  }, [onPick]);

  useEffect(() => {
    let cancelled = false;

    loadNaverMaps()
      .then(() => {
        if (cancelled || !containerRef.current) return;
        const naver = window.naver;

        const hasInitial = typeof lat === "number" && typeof lng === "number";
        const center = hasInitial
          ? new naver.maps.LatLng(lat, lng)
          : new naver.maps.LatLng(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng);

        const map = new naver.maps.Map(containerRef.current, {
          center,
          zoom: hasInitial ? 16 : 13,
          // declutter the small embed
          scaleControl: false,
          mapDataControl: false,
          logoControlOptions: { position: naver.maps.Position.BOTTOM_LEFT },
        });
        mapRef.current = map;

        const place = (position: { lat(): number; lng(): number }) => {
          if (!markerRef.current) {
            markerRef.current = new naver.maps.Marker({
              position,
              map,
              draggable: true,
            });
            naver.maps.Event.addListener(markerRef.current, "dragend", () => {
              const p = markerRef.current.getPosition();
              emit(p.lat(), p.lng());
            });
          } else {
            markerRef.current.setPosition(position);
          }
        };

        const emit = async (la: number, ln: number) => {
          const address = await reverseGeocode(la, ln);
          onPickRef.current({ lat: la, lng: ln, address });
        };

        if (hasInitial) place(center);

        naver.maps.Event.addListener(map, "click", (e: { coord: { lat(): number; lng(): number } }) => {
          place(e.coord);
          map.panTo(e.coord);
          emit(e.coord.lat(), e.coord.lng());
        });
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });

    return () => {
      cancelled = true;
      mapRef.current?.destroy?.();
      mapRef.current = null;
      markerRef.current = null;
    };
    // Initialize once; live updates flow through the marker, not re-init.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // React to coordinates set from outside (e.g. auto-filled from photo EXIF):
  // move/place the pin and recenter without re-initializing the map.
  useEffect(() => {
    if (typeof lat !== "number" || typeof lng !== "number") return;
    const naver = window.naver;
    const map = mapRef.current;
    if (!naver?.maps || !map) return;

    const pos = new naver.maps.LatLng(lat, lng);
    if (markerRef.current) {
      const cur = markerRef.current.getPosition();
      if (Math.abs(cur.lat() - lat) < 1e-7 && Math.abs(cur.lng() - lng) < 1e-7) return;
      markerRef.current.setPosition(pos);
    } else {
      markerRef.current = new naver.maps.Marker({ position: pos, map, draggable: true });
      naver.maps.Event.addListener(markerRef.current, "dragend", () => {
        const p = markerRef.current.getPosition();
        reverseGeocode(p.lat(), p.lng()).then((address) =>
          onPickRef.current({ lat: p.lat(), lng: p.lng(), address }),
        );
      });
    }
    map.setCenter(pos);
    map.setZoom(16);
  }, [lat, lng]);

  if (!NAVER_MAP_KEY) {
    return (
      <div className="flex h-44 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-line bg-card text-center text-[12px] text-ink-faint">
        <span>지도 키가 설정되지 않았어요</span>
        <span className="text-[11px]">NEXT_PUBLIC_NAVER_MAP_KEY 설정 후 사용</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-44 items-center justify-center rounded-xl border border-dashed border-line bg-card px-3 text-center text-[12px] text-ink-faint">
        지도를 불러오지 못했어요 ({error})
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-line">
      {searchEnabled && (
        <PlaceSearch
          onSelect={(p) =>
            // The pin/center follow via the outside-coords effect once the
            // parent writes lat/lng back down — same path as EXIF autofill.
            onPickRef.current({
              lat: p.lat,
              lng: p.lng,
              address: p.address || undefined,
              place: p.name,
            })
          }
        />
      )}
      <div ref={containerRef} className="h-44 w-full bg-line" />
      <p className="bg-card px-3 py-1.5 text-[11px] text-ink-faint">
        {searchEnabled
          ? "장소를 검색하거나, 지도를 탭해 위치를 지정하세요"
          : "지도를 탭하거나 핀을 드래그해 위치를 지정하세요"}
      </p>
    </div>
  );
}

/** Debounced keyword search against /api/places with a result dropdown. */
function PlaceSearch({ onSelect }: { onSelect: (p: PlaceHit) => void }) {
  const [query, setQuery] = useState("");
  // last completed search, keyed by its query — "searching" is derived from
  // whether the stored key still matches, so the effect never sets state
  // synchronously (react-hooks/set-state-in-effect)
  const [hits, setHits] = useState<{ q: string; places: PlaceHit[] } | null>(null);

  const q = query.trim();
  const active = q.length >= 2;
  const results = active && hits?.q === q ? hits.places : null;
  const searching = active && results === null;

  useEffect(() => {
    if (q.length < 2) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/places?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as { places?: PlaceHit[] };
        setHits({ q, places: data.places ?? [] });
      } catch {
        if (!controller.signal.aborted) setHits({ q, places: [] });
      }
    }, 300);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [q]);

  const pick = (p: PlaceHit) => {
    setQuery("");
    onSelect(p);
  };

  return (
    <div className="border-b border-line bg-card">
      <div className="flex items-center gap-2 px-3 py-2">
        <SearchIcon />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          // a bare Enter inside the wizard shouldn't submit anything
          onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
          placeholder="장소 이름으로 검색 (예: 세화 해변)"
          className="w-full bg-transparent text-[13px] text-ink outline-none placeholder:text-ink-faint"
        />
        {query && (
          <button
            type="button"
            aria-label="검색어 지우기"
            onClick={() => setQuery("")}
            className="text-[12px] text-ink-faint"
          >
            ✕
          </button>
        )}
      </div>
      {(searching || results !== null) && (
        <div className="border-t border-line">
          {searching ? (
            <p className="px-3 py-2 text-[12px] text-ink-faint">검색 중…</p>
          ) : results && results.length > 0 ? (
            <ul>
              {results.map((p, i) => (
                <li key={`${p.lat},${p.lng},${i}`}>
                  <button
                    type="button"
                    onClick={() => pick(p)}
                    className="block w-full px-3 py-2 text-left active:bg-line/50"
                  >
                    <span className="block truncate text-[13px] font-medium text-ink">
                      {p.name}
                    </span>
                    <span className="block truncate text-[11px] text-ink-faint">
                      {[p.category, p.address].filter(Boolean).join(" · ")}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-3 py-2 text-[12px] text-ink-faint">검색 결과가 없어요</p>
          )}
        </div>
      )}
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0 text-ink-faint">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
