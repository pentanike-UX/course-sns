"use client";

import { TRANSPORT_LABEL, type TransportMode } from "@/lib/types";

const MODES: TransportMode[] = ["walk", "bus", "subway", "car", "taxi", "bike", "train"];

export default function LegConnector({
  mode,
  transport,
  durationMin,
  autoFilled,
  onTransport,
  onDuration,
}: {
  mode: "ghost" | "edit";
  transport: TransportMode;
  durationMin: string;
  autoFilled?: boolean;
  onTransport?: (m: TransportMode) => void;
  onDuration?: (v: string) => void;
}) {
  const minutes = durationMin.trim() || "—";

  if (mode === "ghost") {
    return (
      <div className="flex items-center gap-3 py-3 pl-4">
        <span className="ml-[13px] h-8 w-px bg-line" aria-hidden />
        <span className="rounded-full bg-muted px-3 py-1 text-[12px] font-semibold text-ink-soft">
          {TRANSPORT_LABEL[transport]}
          {durationMin.trim() ? ` · ${durationMin}분` : ""}
        </span>
      </div>
    );
  }

  const bump = (delta: number) => {
    const n = Number(durationMin);
    const base = Number.isFinite(n) && n > 0 ? n : 5;
    onDuration?.(String(Math.max(3, base + delta)));
  };

  return (
    <div className="relative my-2 ml-4 border-l border-line pl-5">
      <div className="rounded-[20px] bg-card px-4 py-4 ring-1 ring-line/60">
        <p className="mb-3 text-[12px] font-bold text-ink-faint">다음까지 이동</p>
        <div className="flex flex-wrap gap-1.5">
          {MODES.map((m) => {
            const active = transport === m;
            return (
              <button
                key={m}
                type="button"
                aria-pressed={active}
                onClick={() => onTransport?.(m)}
                className={`rounded-full px-3 py-1.5 text-[13px] font-semibold transition-colors ${
                  active ? "bg-ink text-paper" : "bg-muted text-ink-soft"
                }`}
              >
                {TRANSPORT_LABEL[m]}
              </button>
            );
          })}
        </div>
        <div className="mt-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-ink-faint">
              소요 시간{autoFilled ? " · 자동" : ""}
            </p>
            <p className="mt-0.5 text-[22px] font-black tracking-[-0.02em] text-ink">
              {minutes === "—" ? "미정" : `${minutes}분`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => bump(-5)}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-[20px] font-semibold text-ink"
              aria-label="5분 줄이기"
            >
              −
            </button>
            <button
              type="button"
              onClick={() => bump(5)}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-[20px] font-semibold text-ink"
              aria-label="5분 늘리기"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
