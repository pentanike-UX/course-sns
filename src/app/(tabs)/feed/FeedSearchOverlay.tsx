"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { RouteSummary } from "@/lib/types";
import type { FeedSortClient } from "./FeedControls";
import { appendFilterParams, type FeedFilters } from "@/lib/feed-filters";

export default function FeedSearchOverlay({
  q,
  sort,
  filters,
  routes,
  onClose,
}: {
  q: string;
  sort: FeedSortClient;
  filters: FeedFilters;
  routes: RouteSummary[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [text, setText] = useState(q);
  const inputRef = useRef<HTMLInputElement>(null);
  const first = useRef(true);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // debounce q → URL (same pattern as FeedControls had)
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const params = new URLSearchParams();
    if (text.trim()) params.set("q", text.trim());
    if (sort !== "recent") params.set("sort", sort);
    appendFilterParams(params, filters);
    const t = setTimeout(
      () => router.replace(`/${params.toString() ? `?${params}` : ""}`),
      300,
    );
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  const lower = text.toLowerCase();
  const filtered = text.trim()
    ? routes.filter(
        (r) =>
          r.title.toLowerCase().includes(lower) ||
          (r.region ?? "").toLowerCase().includes(lower),
      )
    : routes;

  return (
    <div className="fixed inset-0 z-50 mx-auto flex w-full max-w-[430px] flex-col bg-paper">
      {/* top bar */}
      <div className="flex items-center gap-1 border-b border-line px-2 pt-[max(8px,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="flex h-11 w-11 shrink-0 items-center justify-center text-ink"
        >
          <BackIcon />
        </button>
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="지역·제목으로 검색"
          // ≥16px so iOS doesn't auto-zoom the page on focus (pinch-zoom stays
          // enabled — maximumScale was removed for a11y, which re-armed that zoom)
          className="flex-1 bg-transparent py-3 text-[16px] text-ink outline-none placeholder:text-ink-faint"
        />
        {text && (
          <button
            type="button"
            onClick={() => setText("")}
            aria-label="지우기"
            className="flex h-9 w-9 items-center justify-center text-ink-faint"
          >
            <ClearIcon />
          </button>
        )}
      </div>

      {/* results */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="py-16 text-center text-[14px] text-ink-faint">
            {text.trim()
              ? `'${text}'에 맞는 루트를 찾지 못했어요.`
              : "검색어를 입력하세요."}
          </p>
        ) : (
          <ul>
            {filtered.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/routes/${r.id}`}
                  className="flex items-center gap-3 border-b border-line px-4 py-3"
                >
                  {r.coverPhotoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={r.coverPhotoUrl}
                      alt=""
                      className="h-11 w-11 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-muted text-ink-faint">
                      <PlaceholderIcon />
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-semibold text-ink">
                      {r.title}
                    </span>
                    {r.region && (
                      <span className="block text-[12px] text-ink-faint">
                        {r.region}
                      </span>
                    )}
                  </span>
                  <ChevronIcon />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function BackIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="m15 5-7 7 7 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ClearIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="m6 6 12 12M18 6 6 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PlaceholderIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Zm0 0v14m6-12v14"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      className="shrink-0 text-ink-faint"
    >
      <path
        d="m9 6 6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
