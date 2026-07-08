"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Photo } from "@/lib/types";

export type LightboxPhoto = Photo & {
  spotTitle: string;
  spotIndex: number;
};

type Props = {
  photos: LightboxPhoto[];
  initialIndex: number;
  onClose: () => void;
};

const clamp = (value: number, max: number) => Math.max(0, Math.min(max, value));

export default function PhotoLightbox({ photos, initialIndex, onClose }: Props) {
  const startIndex = clamp(initialIndex, photos.length - 1);
  const [idx, setIdx] = useState(startIndex);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scrollToIndex = useCallback(
    (next: number, behavior: ScrollBehavior = "smooth") => {
      const clamped = clamp(next, photos.length - 1);
      setIdx(clamped);
      const el = scrollerRef.current;
      if (!el) return;
      el.scrollTo({ left: clamped * el.clientWidth, behavior });
    },
    [photos.length],
  );

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const frame = window.requestAnimationFrame(() => {
      scrollToIndex(startIndex, "auto");
    });

    return () => {
      window.cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
    };
  }, [scrollToIndex, startIndex]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") scrollToIndex(idx - 1);
      if (event.key === "ArrowRight") scrollToIndex(idx + 1);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [idx, onClose, scrollToIndex]);

  if (photos.length === 0) return null;

  const current = photos[idx] ?? photos[0];
  const canPrev = idx > 0;
  const canNext = idx < photos.length - 1;

  const onScroll = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const next = clamp(Math.round(el.scrollLeft / el.clientWidth), photos.length - 1);
    if (next !== idx) setIdx(next);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="사진 전체화면 보기"
      className="fixed inset-0 z-[9999] bg-black text-white"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 bg-gradient-to-b from-black/70 to-transparent px-4 pb-16 pt-[calc(env(safe-area-inset-top)+14px)]">
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-white/15 px-2.5 py-1 text-[12px] font-semibold backdrop-blur">
            {idx + 1} / {photos.length}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-white/15 backdrop-blur transition-colors active:bg-white/25"
          >
            <CloseIcon />
          </button>
        </div>
      </div>

      <div
        ref={scrollerRef}
        onScroll={onScroll}
        className="no-scrollbar flex h-full snap-x snap-mandatory overflow-x-auto"
      >
        {photos.map((photo) => (
          <div key={photo.id} className="relative h-full w-full shrink-0 snap-center">
            <Image
              src={photo.url}
              alt={photo.alt ?? photo.spotTitle}
              fill
              sizes="100vw"
              className="object-contain"
              loading={photo.id === current.id ? "eager" : "lazy"}
            />
          </div>
        ))}
      </div>

      <div className="pointer-events-none absolute inset-y-0 left-0 right-0 z-10 hidden items-center justify-between px-3 sm:flex">
        <button
          type="button"
          onClick={() => scrollToIndex(idx - 1)}
          disabled={!canPrev}
          aria-label="이전 사진"
          className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full bg-white/15 backdrop-blur transition-colors active:bg-white/25 disabled:opacity-30"
        >
          <ArrowIcon direction="left" />
        </button>
        <button
          type="button"
          onClick={() => scrollToIndex(idx + 1)}
          disabled={!canNext}
          aria-label="다음 사진"
          className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full bg-white/15 backdrop-blur transition-colors active:bg-white/25 disabled:opacity-30"
        >
          <ArrowIcon direction="right" />
        </button>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/80 to-transparent px-4 pb-[calc(env(safe-area-inset-bottom)+18px)] pt-16">
        <div className="text-[12px] font-semibold text-white/65">스팟 {current.spotIndex + 1}</div>
        <div className="mt-0.5 truncate text-[15px] font-bold text-white">{current.spotTitle}</div>
      </div>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ArrowIcon({ direction }: { direction: "left" | "right" }) {
  const path = direction === "left" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7";
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d={path} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
