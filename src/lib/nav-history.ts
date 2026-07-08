"use client";

/**
 * Tracks whether this tab has navigated within the app, so back buttons can
 * pop real history (returning to wherever the user came from — feed, map,
 * library...) and only fall back to a fixed route on deep-linked entries.
 */
const SEEN = "routdiary:nav-seen";
const NAVIGATED = "routdiary:navigated";

/** call on every pathname change (root layout) */
export function trackNavigation() {
  try {
    if (sessionStorage.getItem(SEEN)) sessionStorage.setItem(NAVIGATED, "1");
    else sessionStorage.setItem(SEEN, "1");
  } catch {
    // private mode etc. — back buttons just use the fallback
  }
}

export function hasInAppHistory(): boolean {
  try {
    return sessionStorage.getItem(NAVIGATED) === "1";
  } catch {
    return false;
  }
}
