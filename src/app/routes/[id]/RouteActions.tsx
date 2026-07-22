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

  const onLike = () => {
    if (!requireAuth({ next: `/routes/${routeId}` })) return; // guest → login sheet
    const next = !liked;
    // optimistic
    setLiked(next);
    setLikeCount((c) => c + (next ? 1 : -1));
    startTransition(async () => {
      const res = await toggleLike(routeId, next);
      if (res?.error) {
        // revert
        setLiked(!next);
        setLikeCount((c) => c + (next ? -1 : 1));
        if (res.needsAuth) requireAuth({ next: `/routes/${routeId}` });
      }
    });
  };

  const onBookmark = () => {
    if (!requireAuth({ next: `/routes/${routeId}` })) return; // guest → login sheet
    const next = !bookmarked;
    setBookmarked(next);
    startTransition(async () => {
      const res = await toggleBookmark(routeId, next);
      if (res?.error) {
        setBookmarked(!next);
        if (res.needsAuth) requireAuth({ next: `/routes/${routeId}` });
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onLike}
        aria-pressed={liked}
        className={`flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[14px] font-semibold transition-colors ${
          liked
            ? "border-transparent bg-sunset-wash text-sunset-ink"
            : "border-line bg-card text-ink-soft"
        }`}
      >
        <HeartIcon filled={liked} />
        {likeCount}
      </button>

      <button
        type="button"
        onClick={onBookmark}
        aria-pressed={bookmarked}
        aria-label={bookmarked ? "즐겨찾기 해제" : "즐겨찾기"}
        className={`flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[14px] font-semibold transition-colors ${
          bookmarked
            ? "border-transparent bg-success-soft text-success"
            : "border-line bg-card text-ink-soft"
        }`}
      >
        <BookmarkIcon filled={bookmarked} />
        {bookmarked ? "저장됨" : "저장"}
      </button>
    </div>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="17"
      height="17"
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
      width="17"
      height="17"
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
