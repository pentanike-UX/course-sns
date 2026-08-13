"use client";

type DragHandle = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  attributes: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  listeners: any;
};

export default function SpotTimelineCard({
  index,
  title,
  hero,
  photoCount,
  timeLabel,
  fromPhoto,
  note,
  handle,
  compact = false,
  onOpen,
}: {
  index: number;
  title: string;
  hero?: string;
  photoCount: number;
  timeLabel?: string;
  fromPhoto?: boolean;
  /** 순서 화면 전용. 있으면 사진 아래 한두 줄. compact에는 넣지 않음. */
  note?: string;
  handle?: DragHandle;
  compact?: boolean;
  onOpen?: () => void;
}) {
  const name = title.trim() || `스팟 ${index + 1}`;
  const noteLine = note?.replace(/\s+/g, " ").trim() ?? "";

  if (compact) {
    return (
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-center gap-3 rounded-[16px] bg-card px-3 py-2.5 text-left ring-1 ring-line/60"
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink text-[12px] font-bold text-paper">
          {index + 1}
        </span>
        {hero ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={hero} alt="" className="h-11 w-11 shrink-0 rounded-xl object-cover" />
        ) : (
          <span className="h-11 w-11 shrink-0 rounded-xl bg-muted" />
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-bold text-ink">{name}</span>
          {photoCount > 0 && (
            <span className="text-[12px] text-ink-faint">사진 {photoCount}장</span>
          )}
        </span>
      </button>
    );
  }

  return (
    <div className="overflow-hidden rounded-[22px] bg-card shadow-[var(--shadow-card)] ring-1 ring-line/50">
      <div className="relative">
        <button type="button" onClick={onOpen} className="block w-full text-left">
          <div className="relative aspect-[16/10] bg-muted">
            {hero ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={hero} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-[13px] text-ink-faint">
                사진 없음
              </div>
            )}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
            <div className="absolute bottom-3 left-3 right-3">
              <p className="text-[18px] font-black leading-tight tracking-[-0.01em] text-white">
                {name}
              </p>
              <p className="mt-0.5 text-[12px] font-medium text-white/80">
                {[timeLabel, fromPhoto ? "사진에서 묶음" : null, photoCount ? `${photoCount}장` : null]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
          </div>
        </button>
        <span className="absolute left-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-ink text-[12px] font-bold text-paper shadow-sm">
          {index + 1}
        </span>
        {handle && (
          <button
            type="button"
            {...handle.attributes}
            {...handle.listeners}
            aria-label="순서 변경 (드래그)"
            className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-ink shadow-sm backdrop-blur touch-none"
          >
            <DragGlyph />
          </button>
        )}
      </div>
      {noteLine ? (
        <button
          type="button"
          onClick={onOpen}
          className="block w-full px-5 pb-5 pt-4 text-left"
        >
          <p className="line-clamp-2 text-[15px] leading-relaxed text-ink-soft">{noteLine}</p>
        </button>
      ) : null}
    </div>
  );
}

function DragGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8 7h.01M16 7h.01M8 12h.01M16 12h.01M8 17h.01M16 17h.01"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
    </svg>
  );
}
