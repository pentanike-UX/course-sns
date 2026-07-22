"use client";

import { useState, useTransition } from "react";
import { copyRoute } from "./actions";
import SheetCloseButton from "@/components/SheetCloseButton";
import { useAuthGate } from "@/components/AuthGate";
import type { CopyPurpose } from "@/lib/types";

/**
 * "이 코스 따라가기" — copies the course into my library as a private draft and
 * lands on its edit page (the server action redirects on success). This is the
 * hero action of the 코스 mental model, so it can render as a full-width primary
 * CTA (`prominent`) or the compact inline pill (default).
 */
export default function CopyRouteButton({
  routeId,
  prominent = false,
}: {
  routeId: string;
  prominent?: boolean;
}) {
  const { requireAuth } = useAuthGate();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [purpose, setPurpose] = useState<CopyPurpose | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startCopy = () => {
    if (!purpose) {
      setError("가져올 목적을 선택해 주세요.");
      return;
    }
    if (pending) return;
    setError(null);
    startTransition(async () => {
      const res = await copyRoute(routeId, purpose);
      // on success the action redirects, so we only land here on failure
      if (res?.needsAuth) {
        setOpen(false);
        requireAuth({ next: `/routes/${routeId}` });
        return;
      }
      if (res?.error) setError(res.error);
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          // guests: prompt login instead of opening the 따라가기 sheet
          if (!requireAuth({ next: `/routes/${routeId}` })) return;
          setError(null);
          setOpen(true);
        }}
        disabled={pending}
        className={
          prominent
            ? "flex w-full items-center justify-center gap-2 rounded-full bg-sunset px-4 py-3.5 text-[15px] font-bold text-white shadow-[var(--shadow-sm)] transition-transform active:scale-[0.98] disabled:opacity-60"
            : "flex items-center gap-1.5 rounded-full border border-line bg-card px-3.5 py-2 text-[14px] font-semibold text-ink transition-colors disabled:opacity-60"
        }
      >
        <RouteIcon />
        {pending ? "가져오는 중…" : "이 코스 따라가기"}
      </button>
      {open && (
        <div className="fixed inset-0 z-40 flex items-end bg-black/35" role="presentation">
          <button
            type="button"
            aria-label="닫기"
            className="absolute inset-0 h-full w-full"
            onClick={() => !pending && setOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="이 코스 따라가기 안내"
            className="relative w-full rounded-t-[28px] bg-card px-4 pb-[max(env(safe-area-inset-bottom),18px)] pt-4 shadow-[0_-12px_40px_rgba(0,0,0,0.18)]"
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line" />
            <SheetCloseButton onClick={() => !pending && setOpen(false)} />
            <h3 className="pr-9 text-[19px] font-black leading-tight text-ink">
              이 코스로 시작해 볼까요?
            </h3>
            <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">
              장소와 동선을 그대로 내 코스로 가져와요. 내 일정에 맞게 자유롭게
              바꿀 수 있어요.
            </p>

            <ul className="mt-4 space-y-2 text-[13px] text-ink-soft">
              <GuideItem>코스 순서와 이동 정보를 그대로 담아요</GuideItem>
              <GuideItem>장소를 빼거나 더해 내 코스로 다듬어요</GuideItem>
              <GuideItem>사진·메모는 다녀와서 채워 넣으면 완성돼요</GuideItem>
            </ul>

            <div className="mt-5 grid gap-2">
              <PurposeOption
                value="plan"
                selected={purpose === "plan"}
                title="아직 안 다녀왔어요"
                desc="코스 계획 초안으로 가져와요"
                onSelect={setPurpose}
              />
              <PurposeOption
                value="record"
                selected={purpose === "record"}
                title="이미 다녀왔어요"
                desc="내 코스 기록으로 작성해요"
                onSelect={setPurpose}
              />
            </div>

            {error && (
              <p className="mt-3 rounded-xl bg-error-soft px-3 py-2 text-[12px] text-error" role="alert">
                {error}
              </p>
            )}

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => !pending && setOpen(false)}
                className="rounded-xl border border-line bg-card px-4 py-3 text-[14px] font-semibold text-ink-soft"
              >
                취소
              </button>
              <button
                type="button"
                onClick={startCopy}
                disabled={!purpose || pending}
                className="flex-1 rounded-xl bg-sunset py-3 text-[14px] font-semibold text-white disabled:opacity-40"
              >
                {pending ? "초안 만드는 중…" : "내 비공개 초안 만들기"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function GuideItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2">
      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sunset" />
      <span>{children}</span>
    </li>
  );
}

function PurposeOption({
  value,
  selected,
  title,
  desc,
  onSelect,
}: {
  value: CopyPurpose;
  selected: boolean;
  title: string;
  desc: string;
  onSelect: (value: CopyPurpose) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      aria-pressed={selected}
      className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition-colors ${
        selected ? "border-sunset bg-sunset-wash" : "border-line bg-paper"
      }`}
    >
      <span>
        <span className="block text-[14px] font-bold text-ink">{title}</span>
        <span className="mt-0.5 block text-[12px] text-ink-faint">{desc}</span>
      </span>
      <span
        className={`flex h-5 w-5 items-center justify-center rounded-full border ${
          selected ? "border-sunset bg-sunset" : "border-line bg-card"
        }`}
        aria-hidden
      >
        {selected && <span className="h-2 w-2 rounded-full bg-white" />}
      </span>
    </button>
  );
}

function RouteIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <circle cx="6" cy="18" r="2.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M8.5 18H15a3.5 3.5 0 0 0 0-7H9a3.5 3.5 0 0 1 0-7h3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeDasharray="0.1 3.4"
      />
      <path
        d="M18 3c-1.7 0-3 1.3-3 2.9 0 2 3 4.6 3 4.6s3-2.6 3-4.6C21 4.3 19.7 3 18 3Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  );
}
