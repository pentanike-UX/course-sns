"use client";

/** Quiet iOS-like progress — dots only, no step labels crowding the chrome. */
export default function CreateDotStepper({
  current,
  total = 4,
}: {
  current: number;
  total?: number;
}) {
  return (
    <div className="flex items-center justify-center gap-1.5 py-2">
      {Array.from({ length: total }, (_, i) => {
        const n = i + 1;
        const active = n === current;
        const done = n < current;
        return (
          <span
            key={n}
            className={
              active
                ? "h-1.5 w-5 rounded-full bg-ink transition-all duration-300"
                : done
                  ? "h-1.5 w-1.5 rounded-full bg-ink/70 transition-all duration-300"
                  : "h-1.5 w-1.5 rounded-full bg-line transition-all duration-300"
            }
          />
        );
      })}
      <span className="sr-only">
        {total}단계 중 {current}단계
      </span>
    </div>
  );
}
