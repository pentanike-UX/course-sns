"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import RouteCard from "@/components/RouteCard";
import { toggleBookmark, toggleLike } from "@/app/routes/[id]/actions";
import type { RouteSummary } from "@/lib/types";

type Props = { route: RouteSummary; tab: "saved" | "liked" };

/** A library card with a one-tap "remove from this collection" control. */
export default function CollectionCard({ route, tab }: Props) {
  const router = useRouter();
  const [removed, setRemoved] = useState(false);
  const [pending, start] = useTransition();

  if (removed) return null;

  const onRemove = () =>
    start(async () => {
      const res =
        tab === "saved"
          ? await toggleBookmark(route.id, false)
          : await toggleLike(route.id, false);
      if (!res?.error) {
        setRemoved(true);
        router.refresh();
      }
    });

  return (
    <div className="relative">
      <RouteCard route={route} />
      <button
        type="button"
        onClick={onRemove}
        disabled={pending}
        aria-label={tab === "saved" ? "저장 해제" : "좋아요 해제"}
        className="absolute right-2.5 top-2.5 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur disabled:opacity-50"
      >
        {tab === "saved" ? <BookmarkFilled /> : <HeartFilled />}
      </button>
    </div>
  );
}

function BookmarkFilled() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1Z" />
    </svg>
  );
}

function HeartFilled() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}
