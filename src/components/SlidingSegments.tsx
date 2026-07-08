"use client";

import JellyButton from "@/components/JellyButton";

/** Segmented control whose active pill slides between options. */
export default function SlidingSegments<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  const idx = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );

  return (
    <div className="relative flex rounded-full bg-muted p-1">
      <span
        aria-hidden
        className="absolute bottom-1 top-1 rounded-full bg-card shadow-[var(--shadow-sm)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] dark:bg-white/[0.14]"
        style={{
          width: `calc((100% - 8px) / ${options.length})`,
          transform: `translateX(${idx * 100}%)`,
        }}
      />
      {options.map((o) => (
        <JellyButton
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          aria-pressed={o.value === value}
          className={`relative z-10 flex-1 rounded-full py-2 text-center text-[13px] font-semibold transition-colors duration-200 ${
            o.value === value ? "text-ink" : "text-ink-faint"
          }`}
        >
          {o.label}
        </JellyButton>
      ))}
    </div>
  );
}
