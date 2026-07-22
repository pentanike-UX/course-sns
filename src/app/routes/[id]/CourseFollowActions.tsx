"use client";

import Link from "next/link";
import CopyRouteButton from "./CopyRouteButton";
import CompleteCourseButton from "./CompleteCourseButton";
import type { ViewerCompletionState } from "@/lib/types";

/**
 * Detail CTA state machine for the follow loop (Wave B tones):
 * - not copied → Primary brand「따라가기」
 * - copied, not completed → Primary brand-outline「다녀왔어요」+ Secondary 내 초안
 * - completed → Primary neutral「후기 수정」+ Secondary 내 초안
 */
export default function CourseFollowActions({
  routeId,
  viewerCompletion,
}: {
  routeId: string;
  viewerCompletion?: ViewerCompletionState | null;
}) {
  const hasCopied = !!viewerCompletion?.hasCopied;
  const draftId = viewerCompletion?.copiedRouteId;
  const hasCompletion = !!viewerCompletion?.completion;

  if (!hasCopied) {
    return (
      <div className="mt-3 space-y-2">
        <CopyRouteButton routeId={routeId} prominent />
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-2">
      {viewerCompletion && (
        <CompleteCourseButton routeId={routeId} state={viewerCompletion} prominent />
      )}
      {draftId && (
        <Link
          href={`/routes/${draftId}/edit`}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-line bg-card px-4 py-3 text-[14px] font-bold text-ink-soft transition-colors active:scale-[0.98]"
        >
          {hasCompletion ? "내 초안 다시 보기" : "내 초안 열기 · 다듬기"}
        </Link>
      )}
    </div>
  );
}
