"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import type { Photo } from "@/lib/types";
import { ViewTransition } from "@/lib/view-transition";

/**
 * Instagram-feed-style photo carousel: full-width 4:5 frames with horizontal
 * scroll-snap swiping, an `i/n` count badge, and a segmented bar indicator.
 *
 * When `morphName` is set, the first frame's image carries that view-transition
 * name so it can morph from the route card (used for the B-layout hero).
 */
export default function PhotoCarousel({
  photos,
  alt,
  morphName,
  eagerFirst = false,
  showDots = true,
  className = "",
}: {
  photos: Photo[];
  alt: string;
  morphName?: string;
  eagerFirst?: boolean;
  showDots?: boolean;
  className?: string;
}) {
  const [idx, setIdx] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  if (photos.length === 0) return null;

  const onScroll = () => {
    const el = ref.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== idx) setIdx(Math.max(0, Math.min(photos.length - 1, i)));
  };

  return (
    <div className={`relative bg-line ${className}`}>
      <div
        ref={ref}
        onScroll={onScroll}
        className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto"
      >
        {photos.map((ph, i) => {
          const img = (
            <div className="absolute inset-0 overflow-hidden">
              <Image
                src={ph.url}
                alt={ph.alt ?? alt}
                fill
                sizes="430px"
                loading={eagerFirst && i === 0 ? "eager" : undefined}
                fetchPriority={eagerFirst && i === 0 ? "high" : undefined}
                className="object-cover"
              />
            </div>
          );
          return (
            <div key={ph.id} className="relative aspect-[4/5] w-full shrink-0 snap-center">
              {i === 0 && morphName ? (
                <ViewTransition name={morphName} share="route-cover-morph">
                  {img}
                </ViewTransition>
              ) : (
                img
              )}
            </div>
          );
        })}
      </div>

      {photos.length > 1 && (
        <span className="pointer-events-none absolute bottom-3 right-3 z-10 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur">
          {idx + 1} / {photos.length}
        </span>
      )}
      {showDots && photos.length > 1 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-3 z-10 flex justify-center gap-1.5 px-20">
          {photos.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all duration-200 ${
                i === idx ? "w-5 bg-white" : "w-1.5 bg-white/55"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
