"use client";

import Link from "next/link";
import CollectionCard from "./CollectionCard";
import FollowingPanel from "./FollowingPanel";
import SegPager from "@/components/SegPager";
import PanelSkeleton from "@/components/PanelSkeleton";
import SlidingSegments from "@/components/SlidingSegments";
import { useSegTabs } from "@/lib/use-seg-tabs";
import type { RouteSummary } from "@/lib/types";
import type { PersonSummary } from "@/lib/data";

export type LibraryTab = "saved" | "liked" | "following";

const TAB_ORDER = ["saved", "liked", "following"] as const;

/** 저장/좋아요/팔로잉 segment + list — instant client switch with swipe. */
export default function LibraryTabs({
  saved,
  liked,
  followingPeople,
  initialTab,
}: {
  saved: RouteSummary[];
  liked: RouteSummary[];
  followingPeople: PersonSummary[];
  initialTab: LibraryTab;
}) {
  const { tab, select } = useSegTabs<LibraryTab>(initialTab, (t) =>
    t === "liked" ? "/library" : `/library?tab=${t}`,
  );

  const renderPanel = (t: LibraryTab) => {
    // 팔로잉 = 팔로우한 회원 관리 + 회원 검색(친구 찾기)
    if (t === "following") return <FollowingPanel following={followingPeople} />;
    const routes = t === "liked" ? liked : saved;
    if (routes.length === 0) return <EmptyState tab={t} />;
    return (
      <ul className="space-y-4 px-4 pb-8 pt-4">
        {routes.map((r) => (
          <li key={r.id}>
            <CollectionCard route={r} tab={t} />
          </li>
        ))}
      </ul>
    );
  };

  return (
    <>
      {/* Segment pinned under the collapsing large-title bar so 저장/좋아요/팔로잉
          stays switchable while the list scrolls (frame's internal scroll). */}
      <div className="sticky top-[calc(env(safe-area-inset-top)+3.5rem)] z-10 bg-paper/95 px-4 pb-2 pt-2 backdrop-blur">
        <SlidingSegments
          options={[
            { value: "saved", label: "저장" },
            { value: "liked", label: "좋아요" },
            { value: "following", label: "팔로잉" },
          ]}
          value={tab}
          onChange={select}
        />
      </div>

      <SegPager
        order={TAB_ORDER}
        active={tab}
        onChange={select}
        renderPanel={renderPanel}
        renderPlaceholder={() => <PanelSkeleton />}
      />
    </>
  );
}

function EmptyState({ tab }: { tab: "saved" | "liked" }) {
  return (
    <div className="flex flex-col items-center px-8 py-16 text-center">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-sunset-wash">
        {tab === "saved" ? <BookmarkIcon /> : <HeartIcon />}
      </div>
      <p className="text-[14px] font-semibold text-ink">
        {tab === "saved" ? "저장한 코스가 없어요" : "좋아요한 코스가 없어요"}
      </p>
      <p className="mt-1 text-[13px] leading-relaxed text-ink-faint">
        {tab === "saved" ? (
          <>
            둘러보기에서 마음에 드는 코스를
            <br />
            저장해 두면 여기 모여요.
          </>
        ) : (
          <>
            마음에 든 코스에 좋아요를 누르면
            <br />
            여기에서 다시 볼 수 있어요.
          </>
        )}
      </p>
      <Link
        href="/"
        className="mt-5 rounded-full bg-sunset px-5 py-2.5 text-[13px] font-semibold text-white"
      >
        둘러보기로 가기
      </Link>
    </div>
  );
}

function BookmarkIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--sunset)" strokeWidth="1.8" strokeLinejoin="round">
      <path d="M6 4h12a1 1 0 0 1 1 1v15l-7-4-7 4V5a1 1 0 0 1 1-1Z" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="var(--sunset)">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}
