import { Suspense } from "react";
import MobileFrame from "@/components/MobileFrame";
import BottomNav from "@/components/BottomNav";

export default function TabsLayout({
  children,
  drawer,
}: {
  children: React.ReactNode;
  /** parallel slot for the diary/profile edge drawers, so they overlay the
   *  current tab (e.g. 둘러보기) instead of replacing it — the screen beneath
   *  the drawer stays mounted and visible during the slide. */
  drawer: React.ReactNode;
}) {
  return (
    <MobileFrame shell>
      {/* pb clears the floating dock; content scrolls behind the liquid-glass
          bars. min-h-0 lets this flex child scroll *inside* the h-dvh device
          viewport (MobileFrame shell) on every size — that internal scroll is
          what makes the sticky header/filters pin to the top. */}
      <main data-tabs-scroll-root className="no-scrollbar flex-1 overflow-y-auto overflow-x-hidden pb-28 min-h-0">
        {children}
      </main>
      {/* BottomNav reads ?mode=map via useSearchParams; Suspense keeps the
          static pages from bailing out of prerendering. */}
      <Suspense fallback={null}>
        <BottomNav />
      </Suspense>
      {drawer}
    </MobileFrame>
  );
}
