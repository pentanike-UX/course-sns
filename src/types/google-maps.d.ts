/**
 * Minimal ambient typing for Google Maps JavaScript API.
 * Only the members RouteMap/FeedMap will need. Keep loose like naver-maps.d.ts.
 */
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    google?: { maps?: any };
  }
}

export {};
