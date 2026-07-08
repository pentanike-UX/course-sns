"use client";

import { useState, useTransition } from "react";
import { setDefaultVisibility } from "./actions";
import type { Visibility } from "@/lib/types";

export default function DefaultVisibilitySetting({ initial }: { initial: Visibility }) {
  const [value, setValue] = useState<Visibility>(initial);
  const [, start] = useTransition();

  const choose = (next: Visibility) => {
    if (next === value) return;
    const prev = value;
    setValue(next); // optimistic
    start(async () => {
      const res = await setDefaultVisibility(next);
      if (res?.error) setValue(prev);
    });
  };

  return (
    <div className="flex items-center justify-between border-b border-line px-4 py-3.5 text-[14px] text-ink last:border-0">
      <div>
        <div>공개 범위 기본값</div>
        <div className="mt-0.5 text-[11px] text-ink-faint">새 루트를 만들 때 기본값</div>
      </div>
      <div className="flex rounded-full bg-muted p-0.5 text-[12px] font-semibold">
        {(["private", "public"] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => choose(v)}
            aria-pressed={value === v}
            className={`rounded-full px-3 py-1.5 transition-colors ${
              value === v ? "bg-card text-ink shadow-[var(--shadow-sm)]" : "text-ink-faint"
            }`}
          >
            {v === "private" ? "비공개" : "공개"}
          </button>
        ))}
      </div>
    </div>
  );
}
