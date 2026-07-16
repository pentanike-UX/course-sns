"use client";

import { useRef, useState } from "react";
import { MOOD_LEVELS } from "@/lib/meta-options";
import { useSheetTransition } from "@/lib/use-sheet-transition";
import SheetCloseButton from "@/components/SheetCloseButton";

type Props = {
  open: boolean;
  value?: string; // current mood label
  onApply: (label: string) => void;
  onClose: () => void;
};

const N = MOOD_LEVELS.length;
const startIndex = (label?: string) => {
  const i = MOOD_LEVELS.findIndex((m) => m.label === label);
  return i >= 0 ? i : Math.floor(N / 2);
};

// per-cell color, brand red (top, happiest) → blue (bottom)
function cellColor(i: number) {
  const t = N > 1 ? i / (N - 1) : 0;
  const a = [220, 38, 38]; // brand red
  const b = [59, 135, 232]; // sky blue
  const c = a.map((v, k) => Math.round(v + (b[k] - v) * t));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

/**
 * Thermometer-style mood picker: a vertical bar with face icons (happiest at
 * top → saddest at bottom) on the left and labels on the right. Drag along the
 * bar to snap to a level.
 */
export default function MoodSheet({ open, value, onApply, onClose }: Props) {
  const { render, show } = useSheetTransition(open);
  if (!render) return null;
  return <MoodSheetPanel show={show} value={value} onApply={onApply} onClose={onClose} />;
}

function MoodSheetPanel({
  show,
  value,
  onApply,
  onClose,
}: Omit<Props, "open"> & { show: boolean }) {
  const [idx, setIdx] = useState(() => startIndex(value));
  const barRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const setFromY = (clientY: number) => {
    const el = barRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const t = (clientY - r.top) / r.height; // 0 (top) … 1 (bottom)
    setIdx(Math.round(Math.max(0, Math.min(1, t)) * (N - 1)));
  };

  const onDown = (e: React.PointerEvent) => {
    dragging.current = true;
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    setFromY(e.clientY);
  };
  const onMove = (e: React.PointerEvent) => {
    if (dragging.current) setFromY(e.clientY);
  };
  const onUp = () => {
    dragging.current = false;
  };

  return (
    <div className="fixed inset-0 z-50">
      <div
        className={`absolute inset-0 bg-black/30 transition-opacity duration-200 ${
          show ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />
      <div className="absolute inset-x-0 bottom-0 flex justify-center">
        <div
          className={`relative w-full max-w-[430px] rounded-t-3xl bg-card p-4 pb-7 shadow-[0_-8px_30px_rgba(0,0,0,0.18)] transition-transform duration-200 ease-out ${
            show ? "translate-y-0" : "translate-y-full"
          }`}
        >
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line" />
        <SheetCloseButton onClick={onClose} />
        <h3 className="pr-9 text-[15px] font-bold text-ink">오늘의 감정</h3>
        <p className="mb-4 text-[12px] text-ink-faint">막대를 위아래로 드래그해 골라보세요</p>

        <div className="flex items-stretch justify-center gap-3" style={{ height: 300 }}>
          {/* faces */}
          <div className="flex w-11 flex-col">
            {MOOD_LEVELS.map((m, i) => (
              <div
                key={m.key}
                className={`flex flex-1 items-center justify-center text-2xl transition-all ${
                  i === idx ? "scale-125" : "opacity-35"
                }`}
              >
                {m.emoji}
              </div>
            ))}
          </div>

          {/* continuous rounded gauge — drag fills from the selected level downward */}
          <div
            ref={barRef}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
            className="flex w-11 shrink-0 cursor-pointer touch-none select-none flex-col overflow-hidden rounded-2xl"
          >
            {MOOD_LEVELS.map((m, i) => {
              const filled = i >= idx;
              return (
                <div
                  key={m.key}
                  className="flex-1 transition-colors"
                  style={{
                    background: filled ? cellColor(i) : "var(--bg-sunken)",
                    boxShadow: i === idx ? "inset 0 2px 0 rgba(255,255,255,0.85)" : undefined,
                  }}
                />
              );
            })}
          </div>

          {/* labels */}
          <div className="flex w-28 flex-col">
            {MOOD_LEVELS.map((m, i) => (
              <button
                key={m.key}
                type="button"
                onClick={() => setIdx(i)}
                className={`flex flex-1 items-center text-left text-[13px] transition-colors ${
                  i === idx ? "font-bold text-ink" : "text-ink-faint"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => onApply(MOOD_LEVELS[idx].label)}
          className="mt-5 w-full rounded-xl bg-sunset py-3 text-[15px] font-semibold text-white"
        >
          적용하기
        </button>
        </div>
      </div>
    </div>
  );
}
