"use client";

import { useState, useTransition } from "react";
import { toggleLike, toggleBookmark } from "./actions";
import { useAuthGate } from "@/components/AuthGate";

type Props = {
  routeId: string;
  initialLiked: boolean;
  initialLikeCount: number;
  initialBookmarked: boolean;
};

/**
 * DET-02: icon-only like/save — secondary to「따라가기」, not a competing CTA row.
 */
export default function RouteActions({
  routeId,
  initialLiked,
  initialLikeCount,
  initialBookmarked,
}: Props) {
  const { requireAuth } = useAuthGate();
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [, startTransition] = useTransition();

  const SAVE_AUTH = {
    next: `/routes/${routeId}`,
    title: "저장하려면 로그인이 필요해요",
    description:
      "로그인하면 코스를 저장해 두고 나중에 따라갈 수 있어요. 핵심은 좋아요보다 따라가기예요.",
  } as const;

  const onLike = () => {
    if (!requireAuth(SAVE_AUTH)) return;
    const next = !liked;
    setLiked(next);
    setLikeCount((c) => c + (next ? 1 : -1));
    startTransition(async () => {
      const res = await toggleLike(routeId, next);
      if (res?.error) {
        setLiked(!next);
        setLikeCount((c) => c + (next ? -1 : 1));
        if (res.needsAuth) requireAuth(SAVE_AUTH);
      }
    });
  };

  const onBookmark = () => {
    if (!requireAuth(SAVE_AUTH)) return;
    const next = !bookmarked;
    setBookmarked(next);
    startTransition(async () => {
      const res = await toggleBookmark(routeId, next);
      if (res?.error) {
        setBookmarked(!next);
        if (res.needsAuth) requireAuth(SAVE_AUTH);
      }
    });
  };

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={onLike}
        aria-pressed={liked}
        aria-label={liked ? "좋아요 취소" : "좋아요"}
        className={`flex h-9 min-w-9 items-center justify-center gap-1 rounded-full px-2.5 text-[12px] font-semibold transition-colors ${
          liked ? "bg-muted text-ink-soft" : "text-ink-faint hover:bg-muted/70"
        }`}
      >
        <HeartIcon filled={liked} />
        {likeCount > 0 && <span>{likeCount}</span>}
      </button>

      <button
        type="button"
        onClick={onBookmark}
        aria-pressed={bookmarked}
        aria-label={bookmarked ? "저장 해제" : "저장"}
        className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
          bookmarked ? "bg-muted text-ink-soft" : "text-ink-faint hover:bg-muted/70"
        }`}
      >
        <BookmarkIcon filled={bookmarked} />
      </button>
    </div>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}

function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    >
      <path d="M6 4h12a1 1 0 0 1 1 1v15l-7-4-7 4V5a1 1 0 0 1 1-1Z" />
    </svg>
  );
}
