"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * iOS-style large title that collapses on scroll. At rest the section title is
 * big and bold; once it scrolls away a compact bar (blurred background + small
 * title) cross-fades in. Right-side actions stay pinned and visible throughout.
 *
 * The bar is `fixed` (not `sticky`): MobileFrame is a `min-h-dvh` column whose
 * `overflow-y-auto` main scrolls *with the page*, so sticky wouldn't pin to the
 * viewport — same reason RouteView's floating header uses fixed + frame centring.
 */
export default function LargeTitleHeader({
  title,
  right,
}: {
  title: string;
  right?: ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    // collapse once the large title has scrolled most of the way under the bar
    const onScroll = () => {
      setCollapsed(sentinel.getBoundingClientRect().top <= 16);
    };
    onScroll();
    // window catches page scroll; capture-phase document scroll catches an
    // internally-scrolling container if MobileFrame ever constrains its height.
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("scroll", onScroll, { passive: true, capture: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("scroll", onScroll, { capture: true });
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <>
      {/* fixed compact bar pinned to the viewport, centred on the phone frame */}
      <div className="pointer-events-none fixed left-1/2 top-0 z-20 h-[calc(env(safe-area-inset-top)+3.5rem)] w-full max-w-[430px] -translate-x-1/2">
        <div className="relative flex h-full items-center gap-2 px-3 pt-[env(safe-area-inset-top)]">
          <div
            className={`absolute inset-0 bg-paper/90 backdrop-blur transition-opacity duration-200 ${
              collapsed ? "opacity-100" : "opacity-0"
            }`}
          />
          <span
            className={`relative flex-1 truncate text-[15px] font-bold text-ink transition-all duration-200 ${
              collapsed ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-1 opacity-0"
            }`}
            aria-hidden={!collapsed}
          >
            {title}
          </span>
          {right && <div className="pointer-events-auto relative">{right}</div>}
        </div>
      </div>

      {/* large title in normal flow — scrolls up and fades as the bar takes over */}
      <div className="px-4 pb-2 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
        <h1
          className={`origin-left text-[28px] font-black leading-tight tracking-[-0.01em] text-ink transition-all duration-200 ${
            collapsed ? "-translate-y-1 scale-95 opacity-0" : "scale-100 opacity-100"
          }`}
        >
          {title}
        </h1>
      </div>
      <div ref={sentinelRef} aria-hidden className="h-px" />
    </>
  );
}
