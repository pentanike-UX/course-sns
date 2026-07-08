"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { hasInAppHistory } from "@/lib/nav-history";
import { SLIDE_DRAWER_MS } from "@/components/SlideDrawer";

type SlideOverApi = { close: () => void };
const SlideOverContext = createContext<SlideOverApi | null>(null);

/** Read by BackButton: when a page is wrapped in <SlideOver>, the header back
 *  button plays the slide-out instead of an instant pop. */
export function useSlideOver(): SlideOverApi | null {
  return useContext(SlideOverContext);
}

/**
 * iOS-style pushed screen: a full-frame surface that slides in from the right on
 * mount and slides back out to the right when dismissed (the header back button,
 * via {@link useSlideOver}). After the exit animation it pops history so the user
 * lands back where they came from — deep-linked entries fall back to `fallback`.
 *
 * As a `fixed inset-0` overlay it re-bases to the phone frame on desktop (the
 * MobileFrame shell's transform is its containing block) and covers the bottom
 * nav, so the screen reads as its own surface — exactly like EdgeDrawer, but for
 * full pages outside the (tabs) drawer slot. The outer flex centres the 430px
 * panel; the inner panel carries the slide transform (kept separate so centring
 * and sliding don't fight over translate-x).
 */
export default function SlideOver({
  children,
  fallback = "/",
}: {
  children: ReactNode;
  fallback?: string;
}) {
  const router = useRouter();
  const [shown, setShown] = useState(false);
  const closing = useRef(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    setShown(false);
    window.setTimeout(() => {
      if (hasInAppHistory()) router.back();
      else router.replace(fallback);
    }, SLIDE_DRAWER_MS);
  }, [router, fallback]);

  return (
    <SlideOverContext.Provider value={{ close }}>
      <div className="fixed inset-0 z-40 flex justify-center">
        <div
          className={`relative flex h-full w-full max-w-[430px] flex-col overflow-hidden bg-paper shadow-2xl transition-transform ease-out will-change-transform ${
            shown ? "translate-x-0" : "translate-x-full"
          }`}
          style={{ transitionDuration: `${SLIDE_DRAWER_MS}ms` }}
        >
          {children}
        </div>
      </div>
    </SlideOverContext.Provider>
  );
}
