"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { useSheetTransition } from "@/lib/use-sheet-transition";

/** Shared slide timing for all edge drawers (내 일기, 설정, routed /feed). */
export const SLIDE_DRAWER_MS = 320;
const SLIDE_DRAWER_ENTER_DELAY_MS = 48;
const SLIDE_EASING = "cubic-bezier(0.22, 1, 0.36, 1)";

function slideOff(side: "left" | "right") {
  return side === "right" ? "100%" : "-100%";
}

/**
 * iOS-style edge drawer overlay. Slides in on open (double-rAF so the browser
 * paints the off-screen start pose first) and slides out before `onClosed`.
 */
export default function SlideDrawer({
  open,
  onClosed,
  side = "left",
  zIndex = 50,
  header,
  children,
  onDismiss,
  ariaLabel,
  keepAlive = false,
  deferBody = false,
  bodyPlaceholder,
  onSlideInComplete,
}: {
  open: boolean;
  onClosed?: () => void;
  side?: "left" | "right";
  zIndex?: number;
  header: ReactNode;
  children: ReactNode;
  onDismiss?: () => void;
  ariaLabel?: string;
  keepAlive?: boolean;
  deferBody?: boolean;
  bodyPlaceholder?: ReactNode;
  onSlideInComplete?: () => void;
}) {
  const enterDelayMs = keepAlive ? SLIDE_DRAWER_ENTER_DELAY_MS : 0;
  const { render, show, setShow } = useSheetTransition(
    open,
    SLIDE_DRAWER_MS,
    keepAlive,
    enterDelayMs,
    true,
  );
  const wasRendered = useRef(false);
  const openRef = useRef(open);
  const slideShellRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const onClosedRef = useRef(onClosed);
  const onSlideInCompleteRef = useRef(onSlideInComplete);
  const [bodyReady, setBodyReady] = useState(!deferBody);

  const panelVisible = show || open;

  useEffect(() => {
    onClosedRef.current = onClosed;
  }, [onClosed]);

  useEffect(() => {
    onSlideInCompleteRef.current = onSlideInComplete;
  }, [onSlideInComplete]);

  useEffect(() => {
    if (!deferBody) return;
    if (!open) {
      if (show) return;
      if (!keepAlive) {
        const t = window.setTimeout(() => setBodyReady(false), 0);
        return () => window.clearTimeout(t);
      }
      if (render) {
        const t = window.setTimeout(() => setBodyReady(true), 0);
        return () => window.clearTimeout(t);
      }
      return;
    }
    if (!show) {
      const t = window.setTimeout(() => setBodyReady(false), 0);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => {
      setBodyReady(true);
      onSlideInCompleteRef.current?.();
    }, enterDelayMs + SLIDE_DRAWER_MS);
    return () => window.clearTimeout(t);
  }, [open, show, deferBody, keepAlive, enterDelayMs, render]);

  useLayoutEffect(() => {
    const wasOpen = openRef.current;

    if (open) {
      const shell = slideShellRef.current;
      const backdrop = backdropRef.current;
      if (shell) {
        shell.style.transition = "";
        shell.style.transform = "";
      }
      if (backdrop) {
        backdrop.style.transition = "";
        backdrop.style.opacity = "";
      }
      openRef.current = open;
      return;
    }

    if (!wasOpen) {
      openRef.current = open;
      return;
    }

    openRef.current = open;

    const shell = slideShellRef.current;
    const backdrop = backdropRef.current;
    if (!shell) {
      setShow(false);
      return;
    }

    const off = slideOff(side);
    const ms = SLIDE_DRAWER_MS;

    shell.style.transition = "none";
    shell.style.transform = "translate3d(0,0,0)";
    if (backdrop) {
      backdrop.style.transition = "none";
      backdrop.style.opacity = "1";
    }

    void shell.offsetWidth;

    shell.style.transition = `transform ${ms}ms ${SLIDE_EASING}`;
    shell.style.transform = `translate3d(${off},0,0)`;
    if (backdrop) {
      backdrop.style.transition = `opacity ${ms}ms ${SLIDE_EASING}`;
      backdrop.style.opacity = "0";
    }

    const t = window.setTimeout(() => {
      shell.style.transition = "";
      shell.style.transform = "";
      if (backdrop) {
        backdrop.style.transition = "";
        backdrop.style.opacity = "";
      }
      setShow(false);
    }, ms + 32);

    return () => {
      if (openRef.current) window.clearTimeout(t);
    };
  }, [open, side, setShow]);

  useEffect(() => {
    if (render) {
      wasRendered.current = true;
      return;
    }
    if (wasRendered.current) {
      wasRendered.current = false;
      onClosedRef.current?.();
    }
  }, [render]);

  if (!render) return null;

  const off = side === "right" ? "translate-x-full" : "-translate-x-full";
  const motion = { transitionDuration: `${SLIDE_DRAWER_MS}ms` };
  const useEnterTransition = show && open;

  return (
    <div
      className={`fixed inset-0 flex justify-center ${panelVisible ? "" : "pointer-events-none"}`}
      style={{ zIndex }}
      aria-hidden={!panelVisible}
      role={ariaLabel ? "dialog" : undefined}
      aria-label={ariaLabel}
    >
      <div
        ref={backdropRef}
        className={`absolute inset-0 bg-black/30 ease-out ${
          useEnterTransition
            ? `transition-opacity ${show ? "opacity-100" : "opacity-0"}`
            : panelVisible
              ? "opacity-100"
              : "opacity-0"
        }`}
        style={useEnterTransition ? motion : undefined}
        onClick={onDismiss}
      />
      {/* overflow-visible so slide-out is not clipped by the column wrapper */}
      <div className="relative h-full w-full max-w-[430px] overflow-visible">
        <div
          ref={slideShellRef}
          className={`absolute inset-y-0 left-0 flex h-full w-full flex-col overflow-hidden bg-paper shadow-2xl will-change-transform ${
            panelVisible ? "pointer-events-auto" : "pointer-events-none"
          } ${
            useEnterTransition
              ? "transition-[translate] ease-[cubic-bezier(0.22,1,0.36,1)]"
              : ""
          } ${show ? "translate-x-0" : off}`}
          style={useEnterTransition ? motion : undefined}
        >
          {header}
          <div className="no-scrollbar flex-1 overflow-y-auto pb-10">
            {deferBody && !bodyReady ? bodyPlaceholder : children}
          </div>
        </div>
      </div>
    </div>
  );
}
