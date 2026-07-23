"use client";

import Link from "next/link";
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

/** 따라가는 중 / 저장 / 팔로잉 — course-community library IA (Phase 2). */
export default function LibraryTabs({
  followed,
  saved,
  followingCourses,
  followingPeople,
  initialTab,
}: {
  followed: FollowedCourse[];
  saved: RouteSummary[];
  followingCourses: RouteSummary[];
  followingPeople: PersonSummary[];
  initialTab: LibraryTab;
}) {
  const { tab, select } = useSegTabs<LibraryTab>(initialTab, (t) =>
    t === "following" ? "/library" : `/library?tab=${t === "followingPeople" ? "people" : t}`,
  );

  const renderPanel = (t: LibraryTab) => {
    if (t === "followingPeople") {
      return (
        <FollowingCoursesPanel courses={followingCourses} people={followingPeople} />
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
            <CollectionCard route={r} tab="saved" />
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
            { value: "followingPeople", label: "팔로잉" },
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
  const statusLabel =
    course.followStatus === "done"
      ? "다녀옴"
      : course.followStatus === "tuning"
        ? "다듬는 중"
        : "기록 중";
  // done = ink soft (not brand/success red); tuning = brand wash; recording = muted
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

  return (
    <div className="space-y-2">
      <div className="relative">
        <RouteCard route={course} />
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

/** Persistent next-step checklist for P2 — steps reflect real draft data (Wave E4). */
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
  const spotsOk = course.spotCount >= 1 && course.title.trim().length > 0;
  const moveOk =
    status === "done" ||
    status === "ready" ||
    !!(course.transitLabel || (course.totalDurationMin && course.totalDurationMin > 0));
  const doneOk = status === "done";

  const steps = [
    { label: "스팟 확인", done: spotsOk },
    { label: "이동 확인", done: moveOk },
    { label: "다녀왔어요", done: doneOk },
  ];

  const nextHref =
    status === "done"
      ? editHref
      : !spotsOk || !moveOk
        ? editHref
        : hasOriginal
          ? originalHref
          : editHref;

  const nextLabel =
    status === "done"
      ? "내 초안 보기"
      : !spotsOk
        ? "스팟 다듬기"
        : !moveOk
          ? "이동 확인하기"
          : hasOriginal
            ? "원본에서 후기 남기기"
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
      <Link
        href={nextHref}
        className="mt-1.5 inline-flex text-[12px] font-bold text-sunset-ink underline-offset-2 hover:underline"
      >
        {nextLabel}
      </Link>
    </div>
  );
}

function FollowingCoursesPanel({
  courses,
  people,
}: {
  courses: RouteSummary[];
  people: PersonSummary[];
}) {
  const [mode, setMode] = useState<"courses" | "people">("courses");

  return (
    <div className="pb-8">
      <div className="flex gap-2 px-4 pt-3">
        <SubChip active={mode === "courses"} onClick={() => setMode("courses")}>
          새 코스
        </SubChip>
        <SubChip active={mode === "people"} onClick={() => setMode("people")}>
          사람
        </SubChip>
      </div>
      {mode === "people" ? (
        <FollowingPanel following={people} />
      ) : courses.length === 0 ? (
        <EmptyFollowingCourses />
      ) : (
        <ul className="mt-3 space-y-4 px-4">
          {courses.map((r) => (
            <li key={r.id}>
              <RouteCard route={r} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SubChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full px-3.5 py-1.5 text-[13px] font-bold transition-colors ${
        active ? "bg-ink text-paper" : "bg-muted text-ink-soft"
      }`}
    >
      {children}
    </button>
  );
}

function EmptyFollowed() {
  return (
    <div className="flex flex-col items-center px-8 py-16 text-center">
      <p className="text-[14px] font-semibold text-ink">아직 따라가는 코스가 없어요</p>
      <p className="mt-1 text-[13px] leading-relaxed text-ink-faint">
        둘러보기에서 마음에 드는 코스를
        <br />
        따라가면 여기 모여요.
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

function EmptyFollowingCourses() {
  return (
    <div className="flex flex-col items-center px-8 py-12 text-center">
      <p className="text-[14px] font-semibold text-ink">팔로우한 사람의 새 코스가 없어요</p>
      <p className="mt-1 text-[13px] leading-relaxed text-ink-faint">
        사람 탭에서 취향이 맞는 메이커를 팔로우해 보세요.
      </p>
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
