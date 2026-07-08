"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { deleteRoute } from "@/app/routes/new/actions";
import JellyButton from "@/components/JellyButton";
import GlassCircle from "@/components/GlassCircle";

/**
 * Unified "…" overflow for the route hero header. Folds 공유·수정·삭제 into a
 * single menu so the header keeps only the A/B toggle beside it; 삭제 is gated
 * behind an inline confirm.
 */
export default function RouteMenu({
  routeId,
  title,
  canShare,
  isOwner,
  onHero,
}: {
  routeId: string;
  title: string;
  /** public routes can be shared (link copy / native share) */
  canShare: boolean;
  isOwner: boolean;
  /** glassy styling when floating over hero imagery */
  onHero: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setConfirming(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const onShare = async () => {
    const url = `${location.origin}/routes/${routeId}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `${title} · 코스`, url });
        setOpen(false);
        return;
      } catch {
        /* user cancelled — fall through to copy */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  const onDelete = () =>
    startTransition(async () => {
      await deleteRoute(routeId); // redirects to "/" on success
    });

  if (!canShare && !isOwner) return null;

  return (
    <div ref={ref} className="relative">
      <JellyButton
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          setConfirming(false);
        }}
        aria-label="더보기"
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-11 w-11 items-center justify-center"
      >
        <GlassCircle tone={onHero ? "hero" : "solid"}>
          <DotsIcon />
        </GlassCircle>
      </JellyButton>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-12 z-30 w-44 overflow-hidden rounded-xl border border-line bg-card shadow-lg"
        >
          {confirming ? (
            <div className="p-3">
              <p className="mb-2 text-[13px] text-ink-soft">이 루트를 삭제할까요?</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onDelete}
                  disabled={pending}
                  className="flex-1 rounded-lg bg-[var(--error)] py-2 text-[13px] font-semibold text-white disabled:opacity-50"
                >
                  {pending ? "삭제 중…" : "삭제"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  className="flex-1 rounded-lg border border-line py-2 text-[13px] font-medium text-ink-soft"
                >
                  취소
                </button>
              </div>
            </div>
          ) : (
            <>
              {canShare && (
                <button
                  type="button"
                  role="menuitem"
                  onClick={onShare}
                  className="flex w-full items-center gap-2.5 px-3.5 py-3 text-[14px] font-medium text-ink"
                >
                  <ShareIcon /> {copied ? "링크 복사됨" : "공유"}
                </button>
              )}
              {isOwner && (
                <Link
                  role="menuitem"
                  href={`/routes/${routeId}/edit`}
                  className="flex w-full items-center gap-2.5 border-t border-line px-3.5 py-3 text-[14px] font-medium text-ink first:border-t-0"
                >
                  <PencilIcon /> 수정
                </Link>
              )}
              {isOwner && (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => setConfirming(true)}
                  className="flex w-full items-center gap-2.5 border-t border-line px-3.5 py-3 text-[14px] font-medium text-[var(--error)]"
                >
                  <TrashIcon /> 삭제
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function DotsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="5" r="1.7" />
      <circle cx="12" cy="12" r="1.7" />
      <circle cx="12" cy="19" r="1.7" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
      <path d="M12 3v13M8 7l4-4 4 4" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6" />
    </svg>
  );
}
