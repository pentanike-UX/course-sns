"use client";

/**
 * Tracks whether this tab has navigated within the app, so back buttons can
 * pop real history (returning to wherever the user came from — feed, map,
 * library...) and only fall back to a fixed route on deep-linked entries.
 */
import { COURSE_STORAGE, readSession, writeSession } from "@/lib/course-storage";

const SEEN = COURSE_STORAGE.navSeen;
const NAVIGATED = COURSE_STORAGE.navNavigated;

/** call on every pathname change (root layout) */
export function trackNavigation() {
  try {
    if (readSession(SEEN)) writeSession(NAVIGATED, "1");
    else writeSession(SEEN, "1");
  } catch {
    // private mode etc. — back buttons just use the fallback
  }
}

export function hasInAppHistory(): boolean {
  try {
    return readSession(NAVIGATED) === "1";
  } catch {
    return false;
  }
}
