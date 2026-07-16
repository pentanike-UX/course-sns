"use client";

import HomeRoutesTabs, { type HomeTab } from "@/app/(tabs)/HomeRoutesTabs";
import type { RouteSummary } from "@/lib/types";

/** Shared body for the 내 코스 drawer (routed /feed and explore overlay). */
export default function DiaryDrawerContent({
  displayName,
  routes,
  initialTab = "all",
  overlayUrl,
}: {
  displayName: string;
  routes: RouteSummary[];
  initialTab?: HomeTab;
  /** When set, segment tabs sync to the current page URL instead of /feed. */
  overlayUrl?: boolean;
}) {
  const urlFor = overlayUrl
    ? (t: HomeTab) => {
        const params = new URLSearchParams(window.location.search);
        if (t === "all") params.delete("dtab");
        else params.set("dtab", t);
        const qs = params.toString();
        return `${window.location.pathname}${qs ? `?${qs}` : ""}`;
      }
    : undefined;

  return (
    <>
      <section className="px-4 pb-5 pt-1">
        <p className="text-[13px] font-medium text-ink-soft">{displayName}님의 코스</p>
        <h2 className="mt-0.5 text-[22px] font-black leading-tight text-ink">
          내 코스,
          <br />
          만들고 손봐요
        </h2>
      </section>
      <HomeRoutesTabs routes={routes} initialTab={initialTab} urlFor={urlFor} />
    </>
  );
}
