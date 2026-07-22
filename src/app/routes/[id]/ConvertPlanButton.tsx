"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ActionBottomSheet from "@/components/ActionBottomSheet";
import { convertPlanDraftToRecord } from "./actions";

/**
 * Owner-only header action on a plan draft: convert plan → record
 * (distinct from social "다녀왔어요" completion on the original course).
 */
export default function ConvertPlanButton({ routeId }: { routeId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const convert = async () => {
    setBusy(true);
    setError(null);
    const res = await convertPlanDraftToRecord(routeId);
    if (res?.error) {
      setError(res.error);
      setBusy(false);
      return;
    }
    // page re-renders as a record; this button unmounts
    router.refresh();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-full bg-sunset px-4 py-2 text-[13px] font-black text-white shadow-lg ring-1 ring-white/25 active:scale-95"
      >
        <CheckIcon />
        기록으로 바꾸기
      </button>
      <ActionBottomSheet
        open={open}
        title="코스 기록으로 바꿀까요?"
        description="계획 초안을 기록으로 바꾸면 사진과 팁을 채워 완성할 수 있어요. (원본 코스에 ‘다녀왔어요’ 후기를 남기는 것과는 달라요.)"
        primaryLabel="기록으로 바꾸기"
        secondaryLabel="아직이에요"
        pending={busy}
        onPrimary={convert}
        onClose={() => {
          setOpen(false);
          setError(null);
        }}
        ariaLabel="코스 기록으로 바꾸기"
      >
        {error && (
          <p className="mt-3 rounded-lg bg-error-soft px-3 py-2 text-center text-[12px] text-error" role="alert">
            {error}
          </p>
        )}
      </ActionBottomSheet>
    </>
  );
}

function CheckIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="m5 12.5 4.2 4.2L19 7"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
