"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Drives a bottom sheet's enter/exit animation. Keeps the sheet mounted through
 * its closing transition so it can ease out (not just pop away).
 *
 * - `render`: whether to render the sheet at all (false once the exit finishes).
 * - `show`: whether the sheet is in its on-screen pose (drive translate/opacity).
 *
 * When `externalExit` is true, `show` stays true on close until the caller calls
 * `setShow(false)` after its own exit animation (e.g. SlideDrawer WAAPI).
 */
export function useSheetTransition(
  open: boolean,
  exitMs = 220,
  keepAlive = false,
  enterDelayMs = 0,
  externalExit = false,
) {
  const [render, setRender] = useState(open || keepAlive);
  const [show, setShow] = useState(false);
  const prevOpenRef = useRef(open);
  const prevKeepAliveRef = useRef(keepAlive);

  useEffect(() => {
    const wasOpen = prevOpenRef.current;
    prevOpenRef.current = open;

    if (open) {
      // keepAlive/enterDelayMs can flip while still open — don't restart the enter animation.
      if (wasOpen) return;

      let raf2 = 0;
      let t = 0;
      const raf1 = requestAnimationFrame(() => {
        setRender(true);
        setShow(false);
        raf2 = requestAnimationFrame(() => {
          // Commit the off-screen pose before sliding in (needed for keepAlive re-opens).
          void document.documentElement.getBoundingClientRect();
          t = window.setTimeout(() => setShow(true), enterDelayMs);
        });
      });
      return () => {
        cancelAnimationFrame(raf1);
        cancelAnimationFrame(raf2);
        window.clearTimeout(t);
      };
    }

    let raf2 = 0;
    let raf1 = 0;
    if (!externalExit) {
      raf1 = requestAnimationFrame(() => {
        void document.documentElement.getBoundingClientRect();
        raf2 = requestAnimationFrame(() => setShow(false));
      });
    }
    const t = window.setTimeout(() => {
      if (!keepAlive) setRender(false);
    }, exitMs);
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      window.clearTimeout(t);
    };
  }, [open, exitMs, keepAlive, enterDelayMs, externalExit]);

  // After first close, keepAlive enables — remount off-screen for the next open.
  useEffect(() => {
    const becameWarm = keepAlive && !prevKeepAliveRef.current;
    prevKeepAliveRef.current = keepAlive;
    if (becameWarm && !open) {
      setRender(true);
      setShow(false);
    }
  }, [keepAlive, open]);

  return { render, show, setShow };
}
