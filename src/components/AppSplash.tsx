"use client";

import { useEffect, useState } from "react";
import { APP_VERSION } from "@/lib/version";

/**
 * First-load brand splash. Covers the tab shell on a fresh load (full refresh)
 * while the entered page's data streams in, then fades away. It does NOT reappear
 * on client-side navigation — it's mounted once in the tabs layout and stays
 * hidden for the rest of the session. Hides on the home boot signal (fast path),
 * the window `load` event (any entry route), or a safety timeout.
 */

const MIN_MS = 420; // keep it on screen at least this long (no flash)
const MAX_MS = 3500; // never block longer than this

// Show the splash only once per full page load. It lives INSIDE the mobile frame
// (see MobileFrame) so it stays clipped to the phone column on desktop; because
// the frame remounts on client navigations (e.g. tab → detail), this module-level
// flag keeps it from re-flashing after the first appearance. It resets on a real
// document reload — exactly when a fresh splash is wanted.
let splashShownThisLoad = false;

export default function AppSplash() {
  const [fading, setFading] = useState(false);
  const [gone, setGone] = useState(splashShownThisLoad);

  useEffect(() => {
    if (splashShownThisLoad) return;
    const start = Date.now();
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      splashShownThisLoad = true;
      const wait = Math.max(0, MIN_MS - (Date.now() - start));
      window.setTimeout(() => setFading(true), wait);
    };

    // already booted (event fired before this listener attached)
    if ((window as unknown as { __appReady?: boolean }).__appReady) {
      finish();
    }
    window.addEventListener("app:ready", finish);
    if (document.readyState === "complete") finish();
    else window.addEventListener("load", finish, { once: true });
    const max = window.setTimeout(finish, MAX_MS);

    return () => {
      window.removeEventListener("app:ready", finish);
      window.removeEventListener("load", finish);
      clearTimeout(max);
    };
  }, []);

  if (gone) return null;

  return (
    <div
      aria-hidden
      onTransitionEnd={() => {
        if (fading) setGone(true);
      }}
      className={`absolute inset-0 z-[100] flex flex-col items-center justify-center gap-5 bg-paper transition-opacity duration-300 ${
        fading ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icons/icon-512.png" alt="" width={84} height={84} className="rounded-[20px]" />
      <span className="text-[26px] font-black tracking-tight text-sunset">코스</span>
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-line border-t-sunset" />
      <span className="absolute bottom-[max(24px,env(safe-area-inset-bottom))] text-[12px] font-medium text-ink-faint">
        {APP_VERSION}
      </span>
    </div>
  );
}
