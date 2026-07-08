"use client";

import { useCallback, useEffect, useRef } from "react";
import { SLIDE_DRAWER_MS } from "@/components/SlideDrawer";

/**
 * Same-URL history entry so the OS back gesture closes an overlay before the
 * page beneath. `requestClose` plays the slide-out, then pops the entry.
 */
export function useOverlayHistory(
  open: boolean,
  setOpen: (next: boolean) => void,
  stateKey: string,
  exitMs = SLIDE_DRAWER_MS,
) {
  const pushed = useRef(false);
  const ignorePop = useRef(false);

  const openOverlay = useCallback(() => {
    if (open) return;
    setOpen(true);
    try {
      window.history.pushState({ [stateKey]: 1 }, "");
      pushed.current = true;
    } catch {
      pushed.current = false;
    }
  }, [open, setOpen, stateKey]);

  const requestClose = useCallback(() => {
    if (!open) return;
    setOpen(false);
    if (!pushed.current) return;
    window.setTimeout(() => {
      if (pushed.current) {
        pushed.current = false;
        ignorePop.current = true;
        window.history.back();
      }
    }, exitMs);
  }, [open, setOpen, exitMs]);

  useEffect(() => {
    const onPop = () => {
      if (ignorePop.current) {
        ignorePop.current = false;
        pushed.current = false;
        return;
      }
      pushed.current = false;
      setOpen(false);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [setOpen]);

  return { openOverlay, requestClose };
}
