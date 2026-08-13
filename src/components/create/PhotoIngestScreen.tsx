"use client";

import { type ChangeEvent, type ReactNode } from "react";

export default function PhotoIngestScreen({
  busy,
  note,
  previews,
  onPick,
  title,
  description,
}: {
  busy: boolean;
  note: string | null;
  previews: string[];
  onPick: (files: FileList | null) => void;
  title?: ReactNode;
  description?: ReactNode;
}) {
  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    onPick(e.currentTarget.files);
    e.currentTarget.value = "";
  };

  if (busy) {
    return (
      <div className="flex h-full min-h-[28rem] flex-col items-center justify-center px-8 py-10">
        {previews.length > 0 && (
          <div className="mb-8 flex max-w-full gap-2 overflow-hidden">
            {previews.slice(0, 5).map((src) => (
              <div
                key={src}
                className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-line shadow-sm"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        )}
        <span className="mb-4 h-10 w-10 animate-pulse rounded-full bg-sunset-wash" />
        <h2 className="text-center text-[22px] font-black tracking-[-0.01em] text-ink">
          같은 위치끼리 묶는 중
        </h2>
        <p className="mt-2 max-w-[260px] text-center text-[14px] leading-relaxed text-ink-soft">
          사진의 위치와 시각으로 스팟을 만들고 있어요.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-[28rem] flex-col items-center justify-center px-8 py-6">
      <label className="flex w-full max-w-[320px] cursor-pointer flex-col items-center">
        <span className="flex h-[88px] w-[88px] items-center justify-center rounded-full bg-sunset text-white shadow-[var(--shadow-brand)]">
          <CameraGlyph />
        </span>
        <h2 className="mt-8 text-center text-[26px] font-black leading-tight tracking-[-0.01em] text-ink">
          {title ?? (
            <>
              그날의 사진을
              <br />
              올려주세요
            </>
          )}
        </h2>
        <p className="mt-3 max-w-[240px] text-center text-[14px] leading-relaxed text-ink-soft">
          {description ?? (
            <>
              같은 위치는 한 곳으로 묶어요.
              <br />
              글은 나중에 안 써도 돼요.
            </>
          )}
        </p>
        <span className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-sunset px-8 text-[15px] font-bold text-white shadow-[var(--shadow-brand)]">
          사진 선택하기
        </span>
        <input
          type="file"
          accept="image/*"
          multiple
          aria-label="사진 선택하기"
          className="sr-only"
          disabled={busy}
          onChange={onChange}
        />
      </label>
      {note && (
        <p className="mt-6 max-w-[280px] text-center text-[13px] leading-relaxed text-ink-soft">
          {note}
        </p>
      )}
    </div>
  );
}

function CameraGlyph() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 8a2 2 0 0 1 2-2h2l1.2-1.6a1 1 0 0 1 .8-.4h6a1 1 0 0 1 .8.4L19 6h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12.5" r="3.2" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}
