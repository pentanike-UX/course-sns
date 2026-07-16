"use client";

import { useEffect, useState } from "react";

type Kind = "created" | "saved" | "draft";

const COPY: Record<Kind, { title: string; body: string }> = {
  created: {
    title: "저장했어요",
    body: "공개 범위는 언제든 수정에서 바꿀 수 있어요.",
  },
  saved: {
    title: "수정했어요",
    body: "변경한 내용이 반영됐어요.",
  },
  draft: {
    title: "임시 저장했어요",
    body: "이어서 제목·공개 범위를 다듬을 수 있어요.",
  },
};

/**
 * One-shot toast after create/update redirects (?created=1 | ?saved=1 | ?draft=1).
 * Strips the query so refresh doesn't re-show it.
 */
export default function SaveNotice({ kind }: { kind?: Kind | null }) {
  const [open, setOpen] = useState(!!kind);

  useEffect(() => {
    if (!kind) return;
    const url = new URL(window.location.href);
    url.searchParams.delete("created");
    url.searchParams.delete("saved");
    url.searchParams.delete("draft");
    const qs = url.searchParams.toString();
    window.history.replaceState({}, "", `${url.pathname}${qs ? `?${qs}` : ""}`);
    const t = window.setTimeout(() => setOpen(false), 4200);
    return () => window.clearTimeout(t);
  }, [kind]);

  if (!open || !kind) return null;
  const copy = COPY[kind];

  return (
    <div className="pointer-events-none absolute inset-x-3 top-[max(env(safe-area-inset-top),12px)] z-50">
      <div className="pointer-events-auto rounded-[var(--radius-card)] border border-line bg-card px-4 py-3 shadow-[var(--shadow-md)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[14px] font-bold text-ink">{copy.title}</p>
            <p className="mt-0.5 text-[12px] leading-snug text-ink-soft">{copy.body}</p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="shrink-0 rounded-full px-2 py-1 text-[12px] font-semibold text-ink-faint"
            aria-label="닫기"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
