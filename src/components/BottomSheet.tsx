"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type PointerEvent,
  type ReactNode,
} from "react";

/**
 * Apple-Maps-style floating sheet over a map. Three detents:
 *   0 peek   — a small floating card (equal gaps L/R/bottom), search only
 *   1 medium — taller, still floating with the same side gaps
 *   2 top    — grows toward the top (a safe-area + grabber gap remains) and the
 *              side gaps close so it runs edge-to-edge
 * Height drives the sheet (anchored at the bottom); the side/bottom insets and
 * the bottom radius interpolate as it nears the top detent, so it visibly
 * "docks" to the screen edges. Liquid-glass material frosts the live map
 * behind it. The grabber/header drags with 1:1 finger tracking + momentum;
 * the body scrolls on its own and, when already at the top, a downward pull
 * collapses the sheet (pull-to-collapse).
 */

const SPRING = "cubic-bezier(0.32, 0.72, 0, 1)";
const DUR = "0.46s";
const TRANSITION = ["height", "left", "right", "bottom", "border-radius", "background-color"]
  .map((p) => `${p} ${DUR} ${SPRING}`)
  .join(", ");
const RADIUS = 44;
/** ms of velocity to project past the finger on release (momentum) */
const PROJECT_MS = 130;
/** liquid-glass fill: most transparent as a pill (peek), fully opaque docked
 *  (top); medium interpolates between. */
const PEEK_ALPHA = 0.4;
/** the peek→top fraction the medium detent lands at (peek is tiny next to H,
 *  so this barely moves with viewport height) — keeps the resting medium style
 *  in step with the live drag interpolation without measuring */
const MEDIUM_F = 0.49;

const paperBg = (alpha: number) =>
  alpha >= 1
    ? "var(--paper)"
    : `color-mix(in srgb, var(--paper) ${(alpha * 100).toFixed(1)}%, transparent)`;

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

/** measure env(safe-area-inset-top) in px (once) */
function measureSafeTop() {
  if (typeof document === "undefined") return 0;
  const probe = document.createElement("div");
  probe.style.cssText =
    "position:fixed;top:0;left:0;height:env(safe-area-inset-top);visibility:hidden;pointer-events:none;";
  document.body.appendChild(probe);
  const h = probe.offsetHeight;
  probe.remove();
  return h;
}

type Drag = {
  y: number;
  h0: number;
  H: number;
  heights: [number, number, number];
  lastY: number;
  lastT: number;
  v: number;
  pid?: number;
};

export default function BottomSheet({
  detent,
  onDetentChange,
  header,
  children,
  peekPx = 80,
  mediumFraction = 0.5,
  gapPx = 24,
}: {
  detent: number;
  onDetentChange: (i: number) => void;
  /** sticky drag zone (a grabber is layered above it) */
  header: ReactNode;
  /** scrollable body */
  children: ReactNode;
  peekPx?: number;
  mediumFraction?: number;
  gapPx?: number;
}) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  // grabber clearance below the status bar / dynamic island at the top detent.
  // env(safe-area-inset-top) is 0 without viewport-fit=cover, so floor it at a
  // value that clears the notch/island even in standalone PWA mode.
  const [topGapPx] = useState(() => Math.max(measureSafeTop(), 50) + 14);
  const drag = useRef<Drag | null>(null);

  const heightsPx = (H: number): [number, number, number] => [
    peekPx,
    Math.round(H * mediumFraction),
    H - topGapPx,
  ];

  // peek (f=0) → docked top (f=1): side/bottom gap closes, bottom corners
  // flatten, and the liquid-glass fill goes from transparent pill to opaque sheet
  const geom = (f: number) => ({
    inset: gapPx * (1 - f),
    rBottom: RADIUS * (1 - f),
    alpha: PEEK_ALPHA + (1 - PEEK_ALPHA) * f,
  });

  /** resting style for a detent (CSS units → responsive, no measuring) */
  const styleFor = (i: number): CSSProperties => {
    if (i >= 2) {
      return {
        transition: TRANSITION,
        height: `calc(100% - ${topGapPx}px)`,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: `${RADIUS}px ${RADIUS}px 0 0`,
        backgroundColor: "var(--paper)",
      };
    }
    const { inset, rBottom, alpha } = geom(i === 1 ? MEDIUM_F : 0);
    return {
      transition: TRANSITION,
      height: i === 1 ? `${mediumFraction * 100}%` : `${peekPx}px`,
      left: inset,
      right: inset,
      bottom: inset,
      borderRadius: `${RADIUS}px ${RADIUS}px ${rBottom}px ${rBottom}px`,
      backgroundColor: paperBg(alpha),
    };
  };

  /** write live geometry while dragging (no React render) */
  const paint = (h: number, H: number, animate: boolean) => {
    const sheet = sheetRef.current;
    if (!sheet) return;
    const top = H - topGapPx;
    const f = clamp((h - peekPx) / (top - peekPx), 0, 1); // 0 pill → 1 docked
    const { inset, rBottom, alpha } = geom(f);
    sheet.style.transition = animate ? TRANSITION : "none";
    sheet.style.height = `${h}px`;
    sheet.style.left = `${inset}px`;
    sheet.style.right = `${inset}px`;
    sheet.style.bottom = `${inset}px`;
    sheet.style.borderRadius = `${RADIUS}px ${RADIUS}px ${rBottom}px ${rBottom}px`;
    sheet.style.backgroundColor = paperBg(alpha);
  };

  const nearest = (h: number, heights: [number, number, number]) => {
    let best = 0;
    let bestDist = Infinity;
    heights.forEach((hp, i) => {
      const dist = Math.abs(hp - h);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    });
    return best;
  };

  // ── shared drag core (used by the header pointer drag and the body pull) ──
  const begin = (clientY: number) => {
    const sheet = sheetRef.current;
    const H = sheet?.parentElement?.offsetHeight ?? 1;
    const h0 = sheet?.getBoundingClientRect().height ?? peekPx;
    drag.current = {
      y: clientY,
      h0,
      H,
      heights: heightsPx(H),
      lastY: clientY,
      lastT: performance.now(),
      v: 0,
    };
  };

  const move = (clientY: number) => {
    const d = drag.current;
    if (!d) return;
    const now = performance.now();
    const dt = now - d.lastT;
    if (dt > 0) d.v = (clientY - d.lastY) / dt; // px/ms, down +
    d.lastY = clientY;
    d.lastT = now;

    const peek = d.heights[0];
    const top = d.heights[2];
    let h = d.h0 - (clientY - d.y); // drag up → taller
    if (h > top) h = top + (h - top) * 0.32; // rubber-band past limits
    if (h < peek) h = peek - (peek - h) * 0.32;
    paint(h, d.H, false);
  };

  const finish = (clientY: number) => {
    const d = drag.current;
    if (!d) return;
    drag.current = null;
    const h = clamp(d.h0 - (clientY - d.y), d.heights[0], d.heights[2]);
    // project with release velocity so a flick carries to the next detent
    const projected = clamp(h - d.v * PROJECT_MS, d.heights[0], d.heights[2]);
    const target = nearest(projected, d.heights);
    paint(d.heights[target], d.H, true);
    onDetentChange(target);
  };

  // ── header pointer drag ──
  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    const el = e.target as HTMLElement;
    if (el.closest("input, button, a, [data-no-drag]")) return;
    begin(e.clientY);
    if (drag.current) drag.current.pid = e.pointerId;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (drag.current?.pid !== e.pointerId) return;
    move(e.clientY);
  };
  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (drag.current?.pid !== e.pointerId) return;
    finish(e.clientY);
  };

  // ── body pull-to-collapse: take over only at scrollTop 0 pulling down ──
  useEffect(() => {
    const body = bodyRef.current;
    if (!body) return;
    let mode: "idle" | "scroll" | "sheet" = "idle";
    let sy = 0;

    const ts = (e: TouchEvent) => {
      if (e.touches.length !== 1) {
        mode = "scroll";
        return;
      }
      sy = e.touches[0].clientY;
      mode = "idle";
    };
    const tm = (e: TouchEvent) => {
      const y = e.touches[0].clientY;
      if (mode === "idle") {
        const dy = y - sy;
        if (body.scrollTop <= 0 && dy > 2) {
          mode = "sheet";
          begin(sy);
        } else {
          mode = "scroll";
        }
      }
      if (mode === "sheet") {
        e.preventDefault(); // cancel the overscroll bounce; drive the sheet
        move(y);
      }
    };
    const te = (e: TouchEvent) => {
      if (mode === "sheet") finish(e.changedTouches[0]?.clientY ?? sy);
      mode = "idle";
    };

    body.addEventListener("touchstart", ts, { passive: true });
    body.addEventListener("touchmove", tm, { passive: false });
    body.addEventListener("touchend", te);
    body.addEventListener("touchcancel", te);
    return () => {
      body.removeEventListener("touchstart", ts);
      body.removeEventListener("touchmove", tm);
      body.removeEventListener("touchend", te);
      body.removeEventListener("touchcancel", te);
    };
    // begin/move/finish read refs + stable props; bind once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onFocusCapture = (e: FocusEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).tagName === "INPUT" && detent < 2) onDetentChange(2);
  };

  return (
    <div
      ref={sheetRef}
      onFocusCapture={onFocusCapture}
      className="absolute z-20 flex flex-col overflow-hidden border border-white/45 shadow-[0_-6px_36px_rgba(0,0,0,0.18)] backdrop-blur-2xl backdrop-saturate-200 dark:border-white/[0.06]"
      style={styleFor(detent)}
    >
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="relative shrink-0 cursor-grab touch-none px-5 py-5 active:cursor-grabbing"
      >
        <div className="absolute left-1/2 top-2 h-1 w-9 -translate-x-1/2 rounded-full bg-ink-faint/45" />
        {header}
      </div>
      <div
        ref={bodyRef}
        className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain px-3.5 pb-[max(16px,env(safe-area-inset-bottom))]"
      >
        {children}
      </div>
    </div>
  );
}
