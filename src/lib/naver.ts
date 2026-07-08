/**
 * Naver Maps JS API v3 loader + small helpers.
 *
 * Loads the SDK script once (singleton promise) with the `geocoder` submodule
 * so we can reverse-geocode picked coordinates into a human address.
 *
 * Auth: NAVER Cloud migrated the JS Maps auth param to `ncpKeyId` (the
 * Application's Client ID). Older apps used `ncpClientId`; if you see an
 * "auth failed" overlay on the map, swap the param name below.
 */
"use client";

export const NAVER_MAP_KEY = process.env.NEXT_PUBLIC_NAVER_MAP_KEY;

let loadPromise: Promise<void> | null = null;
// Set by the SDK's global auth-failure callback. When the key is rejected
// (invalid / over-quota / suspended / server error), the SDK still defines
// `window.naver.maps`, so probing for it would otherwise succeed and leave a
// broken "auth fail" map. This flag lets the loader reject promptly instead.
let authFailed = false;

/**
 * The Naver Maps SDK invokes `window.navermap_authFailure()` when key auth
 * fails. Register it once so a failed key surfaces our own fallback ("지도를
 * 불러오지 못했어요") immediately rather than after the 6s submodule timeout.
 */
function installAuthFailureHook() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  if (w.__navermapAuthHookInstalled) return;
  w.__navermapAuthHookInstalled = true;
  w.navermap_authFailure = () => {
    authFailed = true;
    loadPromise = null; // allow a retry after the key is fixed
  };
}

/**
 * Resolve once `window.naver.maps` AND the geocoder submodule (`Service`) are
 * ready — the submodule loads a tick after the main script, so we poll for it.
 * Rejects if the key is unset or it never loads.
 */
export function loadNaverMaps(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("loadNaverMaps must run in the browser"));
  }
  if (window.naver?.maps?.Service) return Promise.resolve();
  if (loadPromise) return loadPromise;

  if (!NAVER_MAP_KEY) {
    return Promise.reject(
      new Error("NEXT_PUBLIC_NAVER_MAP_KEY is not set — see .env.example"),
    );
  }

  installAuthFailureHook();
  authFailed = false;

  loadPromise = new Promise<void>((resolve, reject) => {
    const waitForService = () => {
      const start = Date.now();
      const tick = () => {
        if (authFailed) {
          loadPromise = null;
          reject(new Error("지도 키 인증에 실패했어요 (네이버 키 확인 필요)"));
        } else if (window.naver?.maps?.Service) resolve();
        else if (Date.now() - start > 6000) {
          loadPromise = null;
          reject(new Error("Naver geocoder submodule did not load"));
        } else setTimeout(tick, 40);
      };
      tick();
    };

    if (window.naver?.maps) {
      waitForService(); // script already present, just await the submodule
      return;
    }

    const script = document.createElement("script");
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${NAVER_MAP_KEY}&submodules=geocoder`;
    script.async = true;
    script.onload = waitForService;
    script.onerror = () => {
      loadPromise = null; // allow retry
      reject(new Error("Failed to load the Naver Maps script"));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}

/**
 * Reverse-geocode a coordinate into a road (or jibun) address string.
 * Returns `undefined` if the lookup fails — callers should treat it as optional.
 */
export function reverseGeocode(lat: number, lng: number): Promise<string | undefined> {
  return new Promise((resolve) => {
    const naver = window.naver;
    if (!naver?.maps?.Service) {
      resolve(undefined);
      return;
    }
    naver.maps.Service.reverseGeocode(
      {
        coords: new naver.maps.LatLng(lat, lng),
        orders: [
          naver.maps.Service.OrderType.ROAD_ADDR,
          naver.maps.Service.OrderType.ADDR,
        ].join(","),
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (status: any, response: any) => {
        if (status !== naver.maps.Service.Status.OK) {
          resolve(undefined);
          return;
        }
        const address = response?.v2?.address;
        resolve(address?.roadAddress || address?.jibunAddress || undefined);
      },
    );
  });
}

export type GeoDetail = {
  address?: string;
  area1?: string; // 시/도
  area2?: string; // 시/군/구
  place?: string; // 건물/랜드마크명 (있을 때)
};

/** Reverse-geocode returning both a display address and admin region parts. */
export function reverseGeocodeDetail(lat: number, lng: number): Promise<GeoDetail> {
  return new Promise((resolve) => {
    const naver = window.naver;
    if (!naver?.maps?.Service) {
      resolve({});
      return;
    }
    naver.maps.Service.reverseGeocode(
      {
        coords: new naver.maps.LatLng(lat, lng),
        orders: [
          naver.maps.Service.OrderType.ROAD_ADDR,
          naver.maps.Service.OrderType.ADDR,
        ].join(","),
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (status: any, response: any) => {
        if (status !== naver.maps.Service.Status.OK) {
          resolve({});
          return;
        }
        const v2 = response?.v2;
        const address = v2?.address?.roadAddress || v2?.address?.jibunAddress || undefined;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const results = (v2?.results ?? []) as any[];
        const region = results.map((r) => r?.region).find(Boolean);
        // building/landmark name, when reverse-geocode provides one
        const place = results
          .map((r) => (r?.land?.addition0?.type === "building" ? r?.land?.addition0?.value : undefined))
          .find((v) => !!v);
        resolve({
          address,
          area1: region?.area1?.name || undefined,
          area2: region?.area2?.name || undefined,
          place: place || undefined,
        });
      },
    );
  });
}
