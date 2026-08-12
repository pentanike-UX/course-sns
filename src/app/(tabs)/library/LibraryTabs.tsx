"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import CollectionCard from "./CollectionCard";
import FollowingPanel from "./FollowingPanel";
import RouteCard from "@/components/RouteCard";
import SegPager from "@/components/SegPager";
import PanelSkeleton from "@/components/PanelSkeleton";
import SlidingSegments from "@/components/SlidingSegments";
import { useSegTabs } from "@/lib/use-seg-tabs";
import type { FollowedCourse, PersonSummary } from "@/lib/data";
import type { RouteSummary } from "@/lib/types";

export type LibraryTab = "following" | "saved" | "followingPeople";

const TAB_ORDER = ["following", "saved", "followingPeople"] as const;

/** 따라가는 중 / 저장 / 구독 코스 — transfer vs subscribe IA (FOL-01). */
export default function LibraryTabs({
  followed,
  saved,
  followingCourses,
  followingPeople,
  initialTab,
  initialSubscribeMode = "courses",
}: {
  followed: FollowedCourse[];
  saved: RouteSummary[];
  followingCourses: RouteSummary[];
  followingPeople: PersonSummary[];
  initialTab: LibraryTab;
  /** people only via ?tab=people — stream defaults to courses (FOL-02). */
  initialSubscribeMode?: "courses" | "people";
}) {
  const { tab, select } = useSegTabs<LibraryTab>(initialTab, (t) =>
    t === "following"
      ? "/library"
      : t === "followingPeople"
        ? "/library?tab=subscribed"
        : `/library?tab=${t}`,
  );

  const renderPanel = (t: LibraryTab) => {
    if (t === "followingPeople") {
      return (
        <FollowingCoursesPanel
          key={initialSubscribeMode}
          courses={followingCourses}
          people={followingPeople}
          initialMode={initialSubscribeMode}
        />
      );
    }
    if (t === "following") {
      if (followed.length === 0) return <EmptyFollowed />;
      return (
        <ul className="space-y-4 px-4 pb-8 pt-4">
          {followed.map((r) => (
            <li key={r.id}>
              <FollowedCourseCard course={r} />
            </li>
          ))}
        </ul>
      );
    }
    if (saved.length === 0) return <EmptySaved />;
    return (
      <ul className="space-y-4 px-4 pb-8 pt-4">
        {saved.map((r) => (
          <li key={r.id}>
            <CollectionCard route={r} />
          </li>
        ))}
      </ul>
    );
  };

  return (
    <>
      <div className="sticky top-[calc(env(safe-area-inset-top)+3.5rem)] z-10 bg-paper/95 px-4 pb-2 pt-2 backdrop-blur">
        <SlidingSegments
          options={[
            { value: "following", label: "따라가는 중" },
            { value: "saved", label: "저장" },
            { value: "followingPeople", label: "구독 코스" },
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

function FollowedCourseCard({ course }: { course: FollowedCourse }) {
  // Follow-loop language (LIB-02) — avoid diary「기록 중」
  const statusLabel =
    course.followStatus === "done"
      ? "다녀옴"
      : course.followStatus === "tuning"
        ? "다듬는 중"
        : "실행 준비";
  // done = ink soft (not brand/success red); tuning = brand wash; preparing = muted
  const statusClass =
    course.followStatus === "done"
      ? "bg-muted text-ink ring-1 ring-line"
      : course.followStatus === "tuning"
        ? "bg-sunset-wash text-sunset-ink"
        : "bg-muted text-ink-soft";

  const editHref = `/routes/${course.id}/edit`;
  const originalHref = course.originalRouteId
    ? `/routes/${course.originalRouteId}`
    : editHref;
  // P2-CARD: incomplete + original → open original (다녀왔어요 CTA). ProgressBar keeps edit.
  const cardHref =
    course.followStatus !== "done" && course.originalRouteId
      ? originalHref
      : `/routes/${course.id}`;

  return (
    <div className="space-y-2">
      <div className="relative">
        <RouteCard route={course} href={cardHref} />
        <span
          className={`absolute left-2.5 top-2.5 z-10 rounded-full px-2.5 py-1 text-[11px] font-bold shadow-sm ${statusClass}`}
        >
          {statusLabel}
        </span>
      </div>
      <FollowProgressBar
        course={course}
        editHref={editHref}
        originalHref={originalHref}
        hasOriginal={!!course.originalRouteId}
      />
    </div>
  );
}

/** Persistent next-step checklist for P2 — steps reflect real draft data (Wave G2). */
function FollowProgressBar({
  course,
  editHref,
  originalHref,
  hasOriginal,
}: {
  course: FollowedCourse;
  editHref: string;
  originalHref: string;
  hasOriginal: boolean;
}) {
  const status = course.followStatus;
  const doneOk = status === "done";
  // LIB-01: do not treat status===ready as move complete — require real transit data.
  // After 다녀왔어요, keep the row visually complete even if draft legs are thin.
  const spotsDataOk = course.spotCount >= 1 && course.title.trim().length > 0;
  const moveDataOk = !!(
    course.transitLabel ||
    (course.totalDurationMin && course.totalDurationMin > 0)
  );
  const spotsOk = doneOk || spotsDataOk;
  const moveOk = doneOk || moveDataOk;

  const steps = [
    { label: "스팟·제목", done: spotsOk },
    { label: "이동 확인", done: moveOk },
    { label: "다녀왔어요", done: doneOk },
  ];

  // LIB-03: after completion, next = tip edit on original (not dead-end draft only).
  const nextHref = doneOk
    ? hasOriginal
      ? originalHref
      : editHref
    : !spotsDataOk || !moveDataOk
      ? editHref
      : hasOriginal
        ? originalHref
        : editHref;

  // Align CTA with the incomplete step (not post-completion「후기」language).
  const nextLabel = doneOk
    ? hasOriginal
      ? "후기 수정"
      : "내 초안 보기"
    : !spotsDataOk
      ? "스팟 다듬기"
      : !moveDataOk
        ? "이동 확인하기"
        : hasOriginal
          ? "원본에서 다녀왔어요"
          : "초안 열기";

  const nextIdx = steps.findIndex((s) => !s.done);

  return (
    <div className="rounded-2xl bg-muted/70 px-3 py-2.5 ring-1 ring-line/50">
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] font-semibold">
        {steps.map((step, i) => (
          <li key={step.label} className="flex items-center gap-1.5">
            {i > 0 && (
              <span className="text-ink-faint" aria-hidden>
                ·
              </span>
            )}
            <span
              className={
                step.done ? "text-ink" : i === nextIdx ? "text-sunset-ink" : "text-ink-faint"
              }
            >
              {step.done ? "✓ " : ""}
              {step.label}
            </span>
          </li>
        ))}
      </ol>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
        <Link
          href={nextHref}
          className="inline-flex text-[12px] font-bold text-sunset-ink underline-offset-2 hover:underline"
        >
          {nextLabel}
        </Link>
        {doneOk && hasOriginal && (
          <Link
            href={editHref}
            className="inline-flex text-[12px] font-medium text-ink-faint underline-offset-2 hover:underline"
          >
            내 초안 보기
          </Link>
        )}
      </div>
    </div>
  );
}

function FollowingCoursesPanel({
  courses,
  people,
  initialMode = "courses",
}: {
  courses: RouteSummary[];
  people: PersonSummary[];
  initialMode?: "courses" | "people";
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"courses" | "people">(initialMode);

  const showCourses = () => {
    setMode("courses");
    router.replace("/library?tab=subscribed", { scroll: false });
  };
  const showPeople = () => {
    setMode("people");
    router.replace("/library?tab=people", { scroll: false });
  };

  return (
    <div className="pb-8">
      {mode === "people" ? (
        <>
          <div className="flex items-center justify-between gap-2 px-4 pt-3">
            <button
              type="button"
              onClick={showCourses}
              className="text-[12px] font-semibold text-ink-soft underline-offset-2 hover:underline"
            >
              ← 구독 코스
            </button>
            <p className="text-[12px] font-bold text-ink">팔로우 관리</p>
          </div>
          <FollowingPanel following={people} />
        </>
      ) : (
        <>
          <div className="flex items-baseline justify-between gap-2 px-4 pt-3">
            <p className="text-[12px] font-semibold text-ink-soft">
              팔로우한 메이커의 새 코스
            </p>
            <button
              type="button"
              onClick={showPeople}
              className="shrink-0 text-[12px] font-semibold text-ink-faint underline-offset-2 hover:underline"
            >
              팔로우 관리
            </button>
          </div>
          {courses.length === 0 ? (
            <EmptyFollowingCourses onFindPeople={showPeople} />
          ) : (
            <ul className="mt-3 space-y-4 px-4">
              {courses.map((r) => (
                <li key={r.id}>
                  <RouteCard route={r} showOwner />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

function EmptyFollowed() {
  return (
    <div className="flex flex-col items-center px-8 py-16 text-center">
      <p className="text-[14px] font-semibold text-ink">아직 따라가는 코스가 없어요</p>
      <p className="mt-1 text-[13px] leading-relaxed text-ink-faint">
        둘러보기에서 따라갈 코스를 가져오면
        <br />
        초안이 여기 모여요.
      </p>
      <Link
        href="/"
        className="mt-5 rounded-full bg-sunset px-5 py-2.5 text-[13px] font-semibold text-white"
      >
        코스 둘러보기
      </Link>
    </div>
  );
}

function EmptyFollowingCourses({ onFindPeople }: { onFindPeople: () => void }) {
  return (
    <div className="flex flex-col items-center px-8 py-12 text-center">
      <p className="text-[14px] font-semibold text-ink">아직 받아 볼 새 코스가 없어요</p>
      <p className="mt-1 text-[13px] leading-relaxed text-ink-faint">
        둘러보기에서 마음에 드는 코스를 보고
        <br />
        메이커를 팔로우하면 여기로 새 코스가 와요.
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        <Link
          href="/"
          className="rounded-full bg-sunset px-5 py-2.5 text-[13px] font-semibold text-white"
        >
          코스 둘러보기
        </Link>
        <button
          type="button"
          onClick={onFindPeople}
          className="rounded-full border border-line bg-card px-5 py-2.5 text-[13px] font-semibold text-ink-soft"
        >
          메이커 찾기
        </button>
      </div>
    </div>
  );
}

function EmptySaved() {
  return (
    <div className="flex flex-col items-center px-8 py-16 text-center">
      <p className="text-[14px] font-semibold text-ink">저장한 코스가 없어요</p>
      <p className="mt-1 text-[13px] leading-relaxed text-ink-faint">
        둘러보기에서 마음에 드는 코스를
        <br />
        저장해 두면 여기 모여요.
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
