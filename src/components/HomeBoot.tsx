"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Rendered at the end of the home page (so it mounts once the home data has
 * resolved): signals the brand splash to fade, and warms the sibling tabs in the
 * background so the first switch to 둘러보기/보관함/프로필 is instant (they're then
 * reused from the client cache per next.config `staleTimes`).
 */
export default function HomeBoot() {
  const router = useRouter();
  useEffect(() => {
    (window as unknown as { __appReady?: boolean }).__appReady = true;
    window.dispatchEvent(new Event("app:ready"));
    // /feed·/profile are client overlays on 둘러보기 — prefetching them used to
    // warm the @drawer intercept slot and flash the old skeleton over the feed.
    router.prefetch("/library");
  }, [router]);
  return null;
}
