"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { flushSync } from "react-dom";

/** ignore touches starting here — browser back/forward gesture zone */
const EDGE_GUARD_PX = 24;
/** movement before we commit the gesture to one axis */
const LOCK_PX = 10;
/** drag past this fraction of the width commits without a flick */
const COMMIT_FRACTION = 0.4;
/** px/ms — fast flicks commit even on short travel */
const FLICK_VELOCITY = 0.45;
/** drag resistance past the first/last tab */
const RUBBER_FACTOR = 0.35;
const SETTLE_MS = 280;
const SETTLE_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

const reducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

type Gesture<T> = {
  id: number;
  startX: number;
  startY: number;
  axis: "h" | "v" | null;
  width: number;
  left?: T;
  right?: T;
  lastX: number;
  lastT: number;
  prevX: number;
  prevT: number;
  /** neighbours already mounted off-screen (warmed before the axis locked) */
  warmed: boolean;
};

/**
 * Finger-tracking pager under a segment: panels sit side by side on a
 * strip that follows the drag 1:1, snapping to the nearest tab (or the
 * flick direction) on release — past the ends it rubber-bands. Segment
 * taps ride the same strip, so tap and swipe read as one motion. Only
 * the active panel stays mounted while idle; neighbors mount for the
 * duration of a drag or settle.
 */
export default function SegPager<T extends string>({
  order,
  active,
  onChange,
  renderPanel,
  renderPlaceholder,
  swipeEnabled = true,
}: {
  order: readonly T[];
  active: T;
  /** fired when a drag commits a new tab (taps already went through the segment) */
  onChange: (tab: T) => void;
  renderPanel: (tab: T) => ReactNode;
  /** cheap stand-in for an off-screen neighbour mid-swipe (e.g. a skeleton); the
   *  full panel renders only once that neighbour is committed/landed */
  renderPlaceholder?: (tab: T) => ReactNode;
  swipeEnabled?: boolean;
}) {
  const [shown, setShown] = useState(active);
  const [sides, setSides] = useState<{ left?: T; right?: T } | null>(null);
  const [settleTarget, setSettleTarget] = useState<{ target: T; sign: 1 | -1 } | null>(null);
  // state mirror of "a drag owns the strip" — refs can't be read in render
  const [dragging, setDragging] = useState(false);
  // the neighbour a drag is committing to: it renders fully (not the placeholder)
  // so it has landed as real content by the time the slide finishes
  const [committing, setCommitting] = useState<T | null>(null);

  // a side panel is the cheap placeholder while it's just a passing neighbour,
  // and the full panel once it's the commit/tap target (or if no placeholder)
  const renderSide = (tab: T): ReactNode =>
    renderPlaceholder && settleTarget?.target !== tab && committing !== tab
      ? renderPlaceholder(tab)
      : renderPanel(tab);

  const containerRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const gestureRef = useRef<Gesture<T> | null>(null);
  const settlingRef = useRef(false);
  const animCleanupRef = useRef<(() => void) | null>(null);

  // segment tap while idle: stage the target on the strip's far side
  // (adjust-state-during-render; the effect below starts the slide).
  // if a slide is already running this re-stages once it finishes, since
  // finishing leaves active !== shown for the newest target
  if (active !== shown && !dragging && settleTarget === null) {
    const sign: 1 | -1 = order.indexOf(active) > order.indexOf(shown) ? 1 : -1;
    setSettleTarget({ target: active, sign });
    setSides(sign > 0 ? { right: active } : { left: active });
  }

  /** animate the strip to `toPx` (null = instant), then run `after` and recenter */
  const settleTo = useCallback((toPx: number | null, after: () => void) => {
    const strip = stripRef.current;
    const finishNow = () => {
      if (strip) strip.style.transition = "none";
      after();
      if (strip) {
        strip.style.transform = "translateX(0px)";
        strip.style.willChange = ""; // release the compositor layer at rest
      }
      settlingRef.current = false;
    };
    if (!strip || toPx === null) {
      finishNow();
      return;
    }
    settlingRef.current = true;
    const finish = () => {
      animCleanupRef.current?.();
      animCleanupRef.current = null;
      finishNow();
    };
    const targetTransform = `translateX(${toPx}px)`;
    if (strip.style.transform === targetTransform) {
      finish();
      return;
    }
    const onEnd = (e: TransitionEvent) => {
      if (e.target === strip) finish();
    };
    strip.addEventListener("transitionend", onEnd);
    const timer = setTimeout(finish, SETTLE_MS + 120);
    animCleanupRef.current = () => {
      strip.removeEventListener("transitionend", onEnd);
      clearTimeout(timer);
    };
    void strip.offsetWidth; // commit the current position before enabling the transition
    strip.style.willChange = "transform";
    strip.style.transition = `transform ${SETTLE_MS}ms ${SETTLE_EASE}`;
    strip.style.transform = targetTransform;
  }, []);

  useEffect(() => {
    if (!settleTarget) return;
    const raf = requestAnimationFrame(() => {
      const w = containerRef.current?.offsetWidth ?? 0;
      settleTo(reducedMotion() || w === 0 ? null : -settleTarget.sign * w, () => {
        flushSync(() => {
          setShown(settleTarget.target);
          setSides(null);
          setSettleTarget(null);
        });
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [settleTarget, settleTo]);

  useEffect(() => () => animCleanupRef.current?.(), []);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (!swipeEnabled || e.pointerType !== "touch") return;
    if (settlingRef.current || settleTarget) return;
    if (e.clientX < EDGE_GUARD_PX || e.clientX > window.innerWidth - EDGE_GUARD_PX) return;
    const i = order.indexOf(shown);
    gestureRef.current = {
      id: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      axis: null,
      width: containerRef.current?.offsetWidth || window.innerWidth,
      left: order[i - 1],
      right: order[i + 1],
      lastX: e.clientX,
      lastT: e.timeStamp,
      prevX: e.clientX,
      prevT: e.timeStamp,
      warmed: false,
    };
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const g = gestureRef.current;
    if (!g || e.pointerId !== g.id) return;
    const dx = e.clientX - g.startX;
    const dy = e.clientY - g.startY;
    if (!g.axis) {
      // Warm the off-screen neighbours as soon as the finger leans horizontal
      // (before the axis fully locks) so a horizontal commit doesn't pay a heavy
      // synchronous mount mid-gesture — without burdening vertical scrolls.
      if (!g.warmed && Math.abs(dx) > 2 && Math.abs(dx) > Math.abs(dy)) {
        g.warmed = true;
        setSides({ left: g.left, right: g.right });
      }
      if (Math.abs(dx) < LOCK_PX && Math.abs(dy) < LOCK_PX) return;
      g.axis = Math.abs(dx) > Math.abs(dy) ? "h" : "v";
      if (g.axis === "h") {
        try {
          containerRef.current?.setPointerCapture(e.pointerId);
        } catch {
          // pointer may already be gone
        }
        flushSync(() => {
          if (!g.warmed) setSides({ left: g.left, right: g.right });
          setDragging(true);
        });
        if (stripRef.current) {
          // promote the strip to its own layer so the 1:1 finger-tracked
          // transform composites instead of repainting the (image-heavy) panels
          stripRef.current.style.willChange = "transform";
          stripRef.current.style.transition = "none";
        }
      } else {
        // vertical scroll: discard the warmed neighbours
        setSides(null);
      }
    }
    if (g.axis !== "h") return;
    g.prevX = g.lastX;
    g.prevT = g.lastT;
    g.lastX = e.clientX;
    g.lastT = e.timeStamp;
    const offEnd = (dx > 0 && g.left == null) || (dx < 0 && g.right == null);
    const strip = stripRef.current;
    if (strip) strip.style.transform = `translateX(${offEnd ? dx * RUBBER_FACTOR : dx}px)`;
  };

  const endDrag = (e: PointerEvent<HTMLDivElement>, cancelled: boolean) => {
    const g = gestureRef.current;
    if (!g || e.pointerId !== g.id) return;
    gestureRef.current = null;
    if (g.axis !== "h") {
      // a warmed-but-not-committed gesture (tap / tiny move): drop the neighbours
      if (g.warmed) setSides(null);
      return;
    }
    const dx = e.clientX - g.startX;
    const target = dx < 0 ? g.right : g.left;
    const vx = (g.lastX - g.prevX) / Math.max(1, g.lastT - g.prevT);
    const flick = Math.abs(vx) > FLICK_VELOCITY && Math.abs(dx) > 24 && vx * dx > 0;
    const commit =
      !cancelled && target != null && (Math.abs(dx) > g.width * COMMIT_FRACTION || flick);
    if (commit) {
      const sign = dx < 0 ? 1 : -1;
      // render the committed neighbour fully before it slides in, so it lands as
      // real content rather than the placeholder
      flushSync(() => setCommitting(target!));
      settleTo(reducedMotion() ? null : -sign * g.width, () => {
        // swap shown + parent state in one flush so render never sees them disagree
        flushSync(() => {
          setShown(target!);
          setSides(null);
          setDragging(false);
          setCommitting(null);
          onChange(target!);
        });
      });
    } else {
      settleTo(reducedMotion() ? null : 0, () =>
        flushSync(() => {
          setSides(null);
          setDragging(false);
        }),
      );
    }
  };

  return (
    <div
      ref={containerRef}
      // clip only the x-axis: the off-screen side panels must stay hidden
      // horizontally, but the incoming panel may be taller than the current
      // one and must not be cut off vertically mid-slide
      className="relative touch-pan-y overflow-x-clip overflow-y-visible"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={(e) => endDrag(e, false)}
      onPointerCancel={(e) => endDrag(e, true)}
    >
      <div ref={stripRef} className="relative">
        {sides?.left != null && (
          <div aria-hidden className="absolute right-full top-0 w-full">
            {renderSide(sides.left)}
          </div>
        )}
        {renderPanel(shown)}
        {sides?.right != null && (
          <div aria-hidden className="absolute left-full top-0 w-full">
            {renderSide(sides.right)}
          </div>
        )}
      </div>
    </div>
  );
}
