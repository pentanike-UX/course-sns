"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import Image from "next/image";
import JellyButton from "@/components/JellyButton";
import type { MapLeg, MapSpot } from "@/components/RouteMap";
import { TRANSPORT_LABEL } from "@/lib/types";
import { formatDuration } from "@/lib/format";

/**
 * Spot detail as a medium-height sheet that slides up over the route map's spot
 * list (the explore map's stacked-sheet pattern). The body is a horizontal
 * scroll-snap carousel — swiping pages between spots with the neighbours moving
 * in alongside — and the map recenters on whichever spot is centred. A footer
 * splits in half into the previous / next spot's movement info (a faded "없음"
 * placeholder when there isn't one). Drag the grabber to dismiss.
 */

const SPRING = "cubic-bezier(0.32, 0.72, 0, 1)";
const ENTER = `transform 0.44s ${SPRING}`;
const DISMISS_PX = 120;

const moveLabel = (leg?: MapLeg) => {
  if (!leg) return "";
  const t = TRANSPORT_LABEL[leg.transport];
  const d = leg.durationMin && leg.durationMin > 0 ? formatDuration(leg.durationMin) : "";
  return d ? `${t} · ${d}` : t;
};

export default function SpotDetailSheet({
  spots,
  legs = [],
  initialIndex,
  onActiveChange,
  onClose,
}: {
  spots: MapSpot[];
  legs?: MapLeg[];
  initialIndex: number;
  onActiveChange?: (i: number) => void;
  onClose: () => void;
}) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const closingRef = useRef(false);
  const drag = useRef<{ y: number; last: number; t: number; v: number; pid?: number } | null>(null);
  const activeRef = useRef(initialIndex);
  const settleRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [active, setActive] = useState(initialIndex);

  // enter: slide up to the medium rest position; start the carousel on the spot
  useEffect(() => {
    const sheet = sheetRef.current;
    const scrim = scrimRef.current;
    const track = trackRef.current;
    if (track) track.scrollLeft = initialIndex * track.clientWidth;
    if (!sheet) return;
    sheet.style.transform = "translateY(100%)";
    if (scrim) scrim.style.opacity = "0";
    const raf = requestAnimationFrame(() => {
      sheet.style.transition = ENTER;
      sheet.style.transform = "translateY(0)";
      if (scrim) {
        scrim.style.transition = "opacity 0.44s ease";
        scrim.style.opacity = "1";
      }
    });
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // track which panel is centred; recenter the map once the scroll settles
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const i = Math.round(track.scrollLeft / Math.max(1, track.clientWidth));
        if (i !== activeRef.current && i >= 0 && i < spots.length) {
          activeRef.current = i;
          setActive(i);
        }
        clearTimeout(settleRef.current);
        settleRef.current = setTimeout(() => onActiveChange?.(activeRef.current), 140);
      });
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      track.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
      clearTimeout(settleRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spots.length]);

  const goTo = (i: number) => {
    const track = trackRef.current;
    if (!track || i < 0 || i >= spots.length) return;
    track.scrollTo({ left: i * track.clientWidth, behavior: "smooth" });
  };

  const close = () => {
    if (closingRef.current) return;
    closingRef.current = true;
    const sheet = sheetRef.current;
    const scrim = scrimRef.current;
    if (scrim) {
      scrim.style.transition = "opacity 0.36s ease";
      scrim.style.opacity = "0";
    }
    if (!sheet) {
      onClose();
      return;
    }
    sheet.style.transition = ENTER;
    sheet.style.transform = "translateY(100%)";
    const done = () => {
      sheet.removeEventListener("transitionend", done);
      onClose();
    };
    sheet.addEventListener("transitionend", done);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") goTo(activeRef.current + 1);
      else if (e.key === "ArrowLeft") goTo(activeRef.current - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── vertical drag-to-dismiss on the grabber/header ──
  const begin = (clientY: number) => {
    drag.current = { y: clientY, last: clientY, t: performance.now(), v: 0 };
    const sheet = sheetRef.current;
    if (sheet) sheet.style.transition = "none";
  };
  const move = (clientY: number) => {
    const d = drag.current;
    const sheet = sheetRef.current;
    if (!d || !sheet) return;
    const now = performance.now();
    const dt = now - d.t;
    if (dt > 0) d.v = (clientY - d.last) / dt;
    d.last = clientY;
    d.t = now;
    let dy = clientY - d.y;
    if (dy < 0) dy *= 0.3;
    sheet.style.transform = `translateY(${dy}px)`;
    const scrim = scrimRef.current;
    if (scrim) scrim.style.opacity = String(Math.max(0, 1 - dy / 420));
  };
  const finishDrag = (clientY: number) => {
    const d = drag.current;
    const sheet = sheetRef.current;
    if (!d || !sheet) return;
    drag.current = null;
    const dy = clientY - d.y;
    if (dy > DISMISS_PX || d.v > 0.5) {
      close();
      return;
    }
    sheet.style.transition = ENTER;
    sheet.style.transform = "translateY(0)";
    const scrim = scrimRef.current;
    if (scrim) {
      scrim.style.transition = "opacity 0.3s ease";
      scrim.style.opacity = "1";
    }
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button, a, [data-no-drag]")) return;
    begin(e.clientY);
    if (drag.current) drag.current.pid = e.pointerId;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (drag.current?.pid !== e.pointerId) return;
    move(e.clientY);
  };
  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (drag.current?.pid !== e.pointerId) return;
    finishDrag(e.clientY);
  };

  const current = spots[active];
  const prevSpot = active > 0 ? spots[active - 1] : null;
  const nextSpot = active < spots.length - 1 ? spots[active + 1] : null;
  const prevLeg = active > 0 ? legs[active - 1] : undefined;
  const nextLeg = active < spots.length - 1 ? legs[active] : undefined;

  return (
    <>
      <div ref={scrimRef} onClick={close} className="absolute inset-0 z-30 bg-black/20" aria-hidden />
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal
        aria-label={current?.title}
        className="absolute inset-x-0 bottom-0 top-[40%] z-40 flex flex-col overflow-hidden rounded-t-[24px] bg-paper shadow-[0_-8px_40px_rgba(0,0,0,0.22)] will-change-transform"
      >
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="relative shrink-0 cursor-grab touch-none px-5 pb-2.5 pt-5 active:cursor-grabbing"
        >
          <div className="absolute left-1/2 top-2 h-1 w-9 -translate-x-1/2 rounded-full bg-ink-faint/45" />
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sunset text-[12px] font-bold text-white">
              {String(current?.label ?? active + 1)}
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-[18px] font-bold text-ink">{current?.title}</h2>
              {current?.address && (
                <p className="mt-0.5 truncate text-[13px] text-ink-faint">{current.address}</p>
              )}
            </div>
            {spots.length > 1 && (
              <span className="mt-1 shrink-0 text-[12px] font-medium text-ink-faint">
                {active + 1} / {spots.length}
              </span>
            )}
            <JellyButton
              type="button"
              onClick={close}
              aria-label="닫기"
              data-no-drag
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-ink-faint"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </JellyButton>
          </div>
        </div>

        {/* carousel: one panel per spot, snapping; neighbours slide in alongside */}
        <div
          ref={trackRef}
          className="no-scrollbar flex min-h-0 flex-1 snap-x snap-mandatory overflow-x-auto overflow-y-hidden overscroll-x-contain"
        >
          {spots.map((s, i) => {
            const photos = s.photos ?? [];
            return (
              <div
                key={`${s.lat}-${s.lng}-${i}`}
                className="h-full w-full shrink-0 snap-center touch-pan-y overflow-y-auto overscroll-contain px-5 pb-4"
              >
                {photos.length > 0 && (
                  <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pt-1">
                    {photos.map((photo) => (
                      <span
                        key={photo.id}
                        className="relative h-40 w-40 shrink-0 overflow-hidden rounded-2xl bg-line"
                      >
                        <Image src={photo.url} alt={photo.alt ?? ""} fill sizes="160px" className="object-cover" />
                      </span>
                    ))}
                  </div>
                )}
                {s.body ? (
                  <p className="whitespace-pre-wrap pt-4 text-[14px] leading-relaxed text-ink-soft">
                    {s.body}
                  </p>
                ) : (
                  !photos.length && (
                    <p className="py-10 text-center text-[13px] text-ink-faint">
                      이 스팟에는 추가 기록이 없어요.
                    </p>
                  )
                )}
              </div>
            );
          })}
        </div>

        {/* footer: previous | next movement info, split in half */}
        {spots.length > 1 && (
          <div className="grid shrink-0 grid-cols-2 gap-px border-t border-line bg-line">
            {prevSpot ? (
              <FootBlock dir="prev" spot={prevSpot} leg={prevLeg} onClick={() => goTo(active - 1)} />
            ) : (
              <EmptyBlock label="이전 스팟 없음" />
            )}
            {nextSpot ? (
              <FootBlock dir="next" spot={nextSpot} leg={nextLeg} onClick={() => goTo(active + 1)} />
            ) : (
              <EmptyBlock label="다음 스팟 없음" />
            )}
          </div>
        )}
      </div>
    </>
  );
}

// generous bottom padding so the movement line clears the phone's rounded
// corner / home indicator (the footer sits at the very screen bottom)
const FOOT_PAD = "px-5 pt-4 pb-[max(22px,env(safe-area-inset-bottom))]";

function FootBlock({
  dir,
  spot,
  leg,
  onClick,
}: {
  dir: "prev" | "next";
  spot: MapSpot;
  leg?: MapLeg;
  onClick: () => void;
}) {
  const info = moveLabel(leg);
  const isNext = dir === "next";
  // the chevron lives OUTSIDE the text column, so the label/title/movement all
  // align to the label's text edge (start for 이전, end for 다음) — not the arrow
  const column = (
    <span
      className={`flex min-w-0 flex-col gap-1.5 ${
        isNext ? "items-end text-right" : "items-start text-left"
      }`}
    >
      <span className="text-[12px] font-bold text-sunset">
        {isNext ? "다음 스팟" : "이전 스팟"}
      </span>
      <span className="max-w-full truncate text-[15px] font-bold text-ink">{spot.title}</span>
      {info && <span className="max-w-full truncate text-[13px] text-ink-soft">{info}</span>}
    </span>
  );
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-start gap-2 bg-card ${FOOT_PAD} transition-colors active:bg-muted ${
        isNext ? "justify-end" : "justify-start"
      }`}
    >
      {!isNext && (
        <span className="mt-0.5 shrink-0 text-sunset">
          <Chevron dir="left" />
        </span>
      )}
      {column}
      {isNext && (
        <span className="mt-0.5 shrink-0 text-sunset">
          <Chevron dir="right" />
        </span>
      )}
    </button>
  );
}

function EmptyBlock({ label }: { label: string }) {
  return (
    <div
      className={`flex items-center justify-center bg-muted ${FOOT_PAD} text-center text-[13px] text-ink-faint`}
    >
      {label}
    </div>
  );
}

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d={dir === "left" ? "m15 5-7 7 7 7" : "m9 5 7 7-7 7"}
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
