"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import ActionBottomSheet from "@/components/ActionBottomSheet";
import { useAuthGate } from "@/components/AuthGate";
import type { ViewerCompletionState } from "@/lib/types";
import { submitCompletion } from "./actions";

/**
 * "다녀왔어요" — the completion loop for followed courses. Only shown when the
 * viewer has copied this course (route_copies lineage) and is not the author.
 */
export default function CompleteCourseButton({
  routeId,
  state,
}: {
  routeId: string;
  state: ViewerCompletionState;
}) {
  const router = useRouter();
  const { requireAuth } = useAuthGate();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState<number | null>(state.completion?.rating ?? null);
  const [tip, setTip] = useState(state.completion?.tip ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!state.hasCopied) return null;

  const hasCompletion = !!state.completion;
  const label = hasCompletion ? "후기 수정" : "다녀왔어요";

  const handleOpen = () => {
    if (!requireAuth({ next: `/routes/${routeId}` })) return;
    setRating(state.completion?.rating ?? null);
    setTip(state.completion?.tip ?? "");
    setError(null);
    setOpen(true);
  };

  const handleSubmit = () => {
    if (pending) return;
    setError(null);
    startTransition(async () => {
      const res = await submitCompletion(routeId, rating, tip);
      if (res?.needsAuth) {
        setOpen(false);
        requireAuth({ next: `/routes/${routeId}` });
        return;
      }
      if (res?.error) {
        setError(res.error);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-full border border-sunset/30 bg-sunset-wash px-4 py-3 text-[14px] font-bold text-sunset-ink transition-colors disabled:opacity-60"
      >
        <CheckIcon />
        {label}
      </button>

      <ActionBottomSheet
        open={open}
        title={hasCompletion ? "후기 수정" : "다녀왔어요!"}
        description="이 코스를 다녀오셨나요? 별점과 팁을 남기면 다른 사람의 선택에 도움이 돼요."
        primaryLabel={pending ? "저장 중…" : "후기 남기기"}
        secondaryLabel="취소"
        onClose={() => !pending && setOpen(false)}
        onPrimary={handleSubmit}
        pending={pending}
        primaryDisabled={!rating && !tip.trim()}
      >
        <div className="mt-4">
          <p className="text-[12px] font-medium text-ink-soft">별점</p>
          <div className="mt-2 flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                aria-label={`${n}점`}
                onClick={() => setRating((prev) => (prev === n ? null : n))}
                className="rounded-lg p-1 transition-transform active:scale-95"
              >
                <StarIcon filled={!!rating && n <= rating} />
              </button>
            ))}
          </div>
        </div>

        <label className="mt-4 block">
          <span className="text-[12px] font-medium text-ink-soft">팁 (선택)</span>
          <textarea
            value={tip}
            onChange={(e) => setTip(e.target.value)}
            placeholder="예: 오전에 가면 덜 붐벼요 · 3번 스팟 근처 주차가 편해요"
            rows={3}
            maxLength={500}
            className="mt-2 w-full resize-none rounded-xl border border-line bg-card px-3 py-2.5 text-[14px] text-ink outline-none placeholder:text-ink-faint focus:border-sunset"
          />
        </label>

        {error && (
          <p className="mt-3 rounded-xl bg-sunset-wash px-3 py-2 text-[12px] text-sunset-ink">
            {error}
          </p>
        )}
      </ActionBottomSheet>
    </>
  );
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden>
      <path
        d="M12 2l2.9 6.6L22 9.8l-5 4.4 1.5 6.8L12 17.8l-6.5 3.2 1.5-6.8-5-4.4 7.1-1.2L12 2z"
        fill={filled ? "var(--sunset)" : "none"}
        stroke={filled ? "var(--sunset)" : "var(--line)"}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 13l4 4L19 7"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
