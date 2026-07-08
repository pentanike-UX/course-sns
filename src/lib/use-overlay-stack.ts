"use client";

import { useEffect, useRef } from "react";
import { SLIDE_DRAWER_MS } from "@/components/SlideDrawer";

type SetterMap<L extends string> = Record<L, (open: boolean) => void>;

/**
 * Same-URL overlay stack with history.pushState. Closing the top layer pops only
 * that entry — layers beneath (e.g. diary under settings) stay open.
 */
export function useOverlayStack<L extends string>() {
  const stack = useRef<L[]>([]);
  const ignorePop = useRef(false);
  const setters = useRef<SetterMap<L>>({} as SetterMap<L>);

  useEffect(() => {
    const onPop = () => {
      if (ignorePop.current) {
        ignorePop.current = false;
        return;
      }
      const layer = stack.current.pop();
      if (layer) setters.current[layer]?.(false);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const register = (layer: L, setOpen: (open: boolean) => void) => {
    setters.current[layer] = setOpen;
  };

  const open = (layer: L) => {
    setters.current[layer]?.(true);
    stack.current.push(layer);
    try {
      window.history.pushState({ rdOverlay: layer }, "");
    } catch {
      stack.current.pop();
    }
  };

  const close = (layer: L, exitMs = SLIDE_DRAWER_MS) => {
    setters.current[layer]?.(false);
    window.setTimeout(() => {
      if (stack.current[stack.current.length - 1] !== layer) return;
      stack.current.pop();
      ignorePop.current = true;
      window.history.back();
    }, exitMs);
  };

  const top = () => stack.current[stack.current.length - 1];

  return { register, open, close, top };
}
