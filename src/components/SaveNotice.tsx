"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Visibility } from "@/lib/types";

type Kind = "created" | "saved" | "draft";

/**
 * One-shot toast after create/update redirects (?created=1 | ?saved=1 | ?draft=1).
 * Strips the query so refresh doesn't re-show it.
 * PUB-02: created copy branches on public vs private + optional bookshelf link.
 */
export default function SaveNotice({
  kind,
  visibility,
  handle,
}: {
  kind?: Kind | null;
  visibility?: Visibility;
  /** Owner handle — links to 책장 when public. */
  handle?: string;
}) {
  const [open, setOpen] = useState(!!kind);

  useEffect(() => {
    if (!kind) return;
    const url = new URL(window.location.href);
    url.searchParams.delete("created");
    url.searchParams.delete("saved");
    url.searchParams.delete("draft");
    const qs = url.searchParams.toString();
    window.history.replaceState({}, "", `${url.pathname}${qs ? `?${qs}` : ""}`);
    const t = window.setTimeout(() => setOpen(false), 5200);
    return () => window.clearTimeout(t);
  }, [kind]);

  if (!open || !kind) return null;

  const isPublic = visibility === "public";
  const copy =
    kind === "created"
      ? isPublic
        ? {
            title: "공개했어요",
            body: "책장에 올랐어요. 다른 사람이 따라갈 수 있어요.",
          }
        : {
            title: "비공개로 저장했어요",
            body: "수정에서 언제든 공개로 바꿀 수 있어요.",
          }
      : kind === "saved"
        ? {
            title: "수정했어요",
            body: isPublic
              ? "변경이 책장에 반영됐어요."
              : "변경한 내용이 반영됐어요.",
          }
        : {
            title: "임시 저장했어요",
            body: "이어서 제목·공개 범위를 다듬을 수 있어요.",
          };

  return (
    <div className="pointer-events-none absolute inset-x-3 top-[max(env(safe-area-inset-top),12px)] z-50">
      <div className="pointer-events-auto rounded-[var(--radius-card)] border border-line bg-card px-4 py-3 shadow-[var(--shadow-md)]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[14px] font-bold text-ink">{copy.title}</p>
            <p className="mt-0.5 text-[12px] leading-snug text-ink-soft">{copy.body}</p>
            {kind === "created" && isPublic && handle && (
              <Link
                href={`/u/${handle}`}
                className="mt-2 inline-flex text-[12px] font-bold text-sunset-ink underline-offset-2 hover:underline"
              >
                내 책장 보기
              </Link>
            )}
            {kind === "created" && isPublic && (
              <Link
                href="/profile/stats"
                className="mt-2 ml-3 inline-flex text-[12px] font-medium text-ink-faint underline-offset-2 hover:underline"
              >
                통계
              </Link>
            )}
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
