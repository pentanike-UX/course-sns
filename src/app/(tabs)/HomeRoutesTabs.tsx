"use client";

import Link from "next/link";
import RouteCard from "@/components/RouteCard";
import PlanRouteRow from "@/components/PlanRouteRow";
import SegPager from "@/components/SegPager";
import PanelSkeleton from "@/components/PanelSkeleton";
import SlidingSegments from "@/components/SlidingSegments";
import { useSegTabs } from "@/lib/use-seg-tabs";
import type { RouteSummary } from "@/lib/types";

export type HomeTab = "all" | "record" | "plan";

const TAB_ORDER = ["all", "record", "plan"] as const;

/**
 * 전체/기록/계획 segment + route list. Client-side so tab switches are
 * instant (no server round-trip) — the URL still tracks the tab via
 * shallow history.replaceState so refresh/share keep working.
 */
export default function HomeRoutesTabs({
  routes,
  initialTab,
  urlFor,
}: {
  routes: RouteSummary[];
  initialTab: HomeTab;
  /** Override shallow URL sync (e.g. explore overlay keeps `/` instead of `/feed`). */
  urlFor?: (tab: HomeTab) => string;
}) {
  const { tab, select } = useSegTabs<HomeTab>(
    initialTab,
    urlFor ?? ((t) => (t === "all" ? "/feed" : `/feed?tab=${t}`)),
  );

  // a route is a 계획 while its copy lineage says so; converted or original
  // routes count as 기록
  const planRoutes = routes.filter((r) => r.copyPurpose === "plan");
  const recordRoutes = routes.filter((r) => r.copyPurpose !== "plan");

  // show the 기록/계획 split (and its drag gesture) only once a plan draft exists
  const segmented = planRoutes.length > 0;

  const renderPanel = (t: HomeTab) => {
    const visible = t === "plan" ? planRoutes : t === "record" ? recordRoutes : routes;
    const isPlan = t === "plan";
    return (
      <>
        <section className="flex items-center justify-between px-4 pt-2">
          <h3 className="text-[15px] font-bold text-ink">
            {t === "plan" ? "코스 계획" : t === "record" ? "코스 기록" : "내 코스"}{" "}
            {visible.length}
          </h3>
          <span className="text-[12px] text-ink-faint">최근순</span>
        </section>

        <ul className={`${isPlan ? "space-y-2.5" : "space-y-4"} px-4 pb-8 pt-3`}>
          {visible.map((r, i) => (
            <li key={r.id}>
              {isPlan ? (
                <PlanRouteRow route={r} />
              ) : (
                <RouteCard route={r} priority={i === 0 && t === tab} />
              )}
            </li>
          ))}

          {isPlan ? (
            <>
              <li>
                <Link
                  href="/routes/new?type=plan"
                  className="flex items-center justify-center gap-2 rounded-[var(--radius-card)] border-2 border-dashed border-sunset/45 bg-sunset-wash/35 py-6 text-[14px] font-bold text-sunset-ink"
                >
                  <PlusIcon />
                  새 코스 계획 만들기
                </Link>
              </li>
              <li>
                <Link
                  href="/"
                  className="flex items-center justify-center gap-2 rounded-[var(--radius-card)] border border-line bg-card py-5 text-[14px] font-semibold text-ink-soft"
                >
                  <MapIcon />
                  둘러보기에서 계획 가져오기
                </Link>
              </li>
            </>
          ) : (
            <li>
              <Link
                href="/routes/new"
                className="flex items-center justify-center gap-2 rounded-[var(--radius-card)] border-2 border-dashed border-line py-7 text-[14px] font-semibold text-ink-soft"
              >
                <PlusIcon />
                새 코스 만들기
              </Link>
            </li>
          )}
        </ul>
      </>
    );
  };

  return (
    <>
      {segmented && (
        <div className="px-4 pb-1">
          <SlidingSegments
            options={[
              { value: "all", label: `전체 ${routes.length}` },
              { value: "record", label: `기록 ${recordRoutes.length}` },
              { value: "plan", label: `계획 ${planRoutes.length}` },
            ]}
            value={tab}
            onChange={select}
          />
        </div>
      )}

      <SegPager
        order={TAB_ORDER}
        active={tab}
        onChange={select}
        renderPanel={renderPanel}
        renderPlaceholder={() => <PanelSkeleton />}
        swipeEnabled={segmented}
      />
    </>
  );
}

function PlusIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function MapIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
      <path
        d="m9 18-5 2V6l5-2 6 2 5-2v14l-5 2-6-2Z"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M9 4v14M15 6v14" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}
