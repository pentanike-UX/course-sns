"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-lvh flex-col items-center justify-center gap-4 bg-paper px-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sunset-wash text-3xl">
        🧭
      </div>
      <div>
        <h1 className="text-[17px] font-bold text-ink">길을 잃었어요</h1>
        <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">
          문제가 생겨 화면을 불러오지 못했어요.
          <br />
          잠시 후 다시 시도해 주세요.
        </p>
      </div>
      <button
        type="button"
        onClick={reset}
        className="rounded-full bg-sunset px-5 py-2.5 text-[14px] font-semibold text-white"
      >
        다시 시도
      </button>
    </div>
  );
}
