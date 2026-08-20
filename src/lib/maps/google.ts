"use client";

/**
 * 해외 코스 타일 — Google Maps JavaScript API.
 * 서버 경로 키(`GOOGLE_MAPS_API_KEY`)와 분리. 이 키는 브라우저 제한(HTTP referrer)을 건다.
 *
 * 연결 위치: `RouteMap.tsx`, `FeedMap.tsx`, `SpotLocationPicker.tsx`, `StatsMap.tsx`
 * `tileProviderForSpots(spots) === "google"` 일 때만 로드.
 *
 * 지금: 로더는 동작한다. 지도 컴포넌트는 아직 네이버만 호출한다.
 */
export const GOOGLE_MAPS_JS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

let loadPromise: Promise<void> | null = null;

export function loadGoogleMaps(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("loadGoogleMaps must run in the browser"));
  }
  if (window.google?.maps?.Map) return Promise.resolve();
  if (loadPromise) return loadPromise;

  if (!GOOGLE_MAPS_JS_KEY) {
    return Promise.reject(
      new Error("NEXT_PUBLIC_GOOGLE_MAPS_KEY is not set — see docs/routing/OVERSEAS.md"),
    );
  }

  loadPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>("script[data-coursee-google-maps]");
    if (existing) {
      waitForMaps(resolve, reject);
      return;
    }
    const script = document.createElement("script");
    script.dataset.courseeGoogleMaps = "1";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_JS_KEY}&language=ko`;
    script.async = true;
    script.onload = () => waitForMaps(resolve, reject);
    script.onerror = () => {
      loadPromise = null;
      reject(new Error("Failed to load the Google Maps script"));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}

function waitForMaps(resolve: () => void, reject: (err: Error) => void) {
  const start = Date.now();
  const tick = () => {
    if (window.google?.maps?.Map) resolve();
    else if (Date.now() - start > 8000) {
      loadPromise = null;
      reject(new Error("Google Maps JS did not initialize"));
    } else setTimeout(tick, 40);
  };
  tick();
}
