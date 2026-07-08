"use client";

import { useState } from "react";

/**
 * Segment tab state shared by 홈/보관함/둘러보기: instant client switch +
 * shallow URL sync so refresh/deep links keep working. Slide/drag motion
 * lives in components/SegPager.
 */
export function useSegTabs<T extends string>(initial: T, urlFor: (tab: T) => string) {
  const [tab, setTab] = useState(initial);

  const select = (next: T) => {
    if (next === tab) return;
    setTab(next);
    window.history.replaceState(null, "", urlFor(next));
  };

  return { tab, select };
}
