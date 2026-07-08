/**
 * Minimal ambient typing for the Naver Maps JS API v3.
 *
 * The SDK attaches a global `naver` object once the script loads. We only need
 * a handful of members, so this is intentionally loose — the surface is large
 * and not worth modeling fully.
 */
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    naver: any;
  }
}

export {};
