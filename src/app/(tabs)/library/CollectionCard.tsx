"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import RouteCard from "@/components/RouteCard";
import CopyRouteButton from "@/app/routes/[id]/CopyRouteButton";
import { toggleBookmark } from "@/app/routes/[id]/actions";
import type { RouteSummary } from "@/lib/types";

type Props = { route: RouteSummary; tab?: "saved" };

/**
 * Library collection card (LIB-04): saved chrome is distinct from「따라가는 중」—
 * bookmark badge + follow CTA in a footer bar (not an in-progress checklist).
 */
export default function CollectionCard({ route }: Props) {
  const router = useRouter();
  const [removed, setRemoved] = useState(false);
  const [pending, start] = useTransition();

  if (removed) return null;

  const onRemove = () =>
    start(async () => {
      const res = await toggleBookmark(route.id, false);
      if (!res?.error) {
        setRemoved(true);
        router.refresh();
      }
    });

  return (
    <div className="space-y-2">
      <div className="relative overflow-hidden rounded-2xl ring-1 ring-line/80">
        <RouteCard route={route} />
        <span className="absolute left-2.5 top-2.5 z-10 inline-flex max-w-[75%] items-center gap-1 truncate rounded-full bg-paper/95 px-2.5 py-1 text-[11px] font-bold text-ink shadow-sm ring-1 ring-line">
          <BookmarkFilled className="shrink-0 text-ink-soft" />
          저장 · 아직 안 따라감
        </span>
        <button
          type="button"
          onClick={onRemove}
          disabled={pending}
          aria-label="저장 해제"
          className="absolute right-2.5 top-2.5 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur disabled:opacity-50"
        >
          <BookmarkFilled />
        </button>
      </div>
      <div className="flex items-center justify-between gap-3 rounded-2xl bg-muted/60 px-3 py-2.5 ring-1 ring-line/50">
        <p className="min-w-0 text-[12px] font-medium leading-snug text-ink-soft">
          저장만 해 둔 코스예요.
          <br />
          <span className="text-ink">따라가면 초안이 「따라가는 중」으로 옮겨요.</span>
        </p>
        <CopyRouteButton routeId={route.id} short />
      </div>
    </div>
  );
}

function BookmarkFilled({ className = "" }: { className?: string }) {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1Z" />
    </svg>
  );
}
