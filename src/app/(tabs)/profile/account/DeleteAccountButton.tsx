"use client";

import { useState, useTransition } from "react";
import ActionBottomSheet from "@/components/ActionBottomSheet";
import { deleteAccount } from "../actions";

export default function DeleteAccountButton() {
  const [confirming, setConfirming] = useState(false);
  const [pending, start] = useTransition();

  const onDelete = () =>
    start(async () => {
      await deleteAccount(); // redirects to /login on success
    });

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="w-full rounded-xl py-3 text-[14px] font-semibold text-[var(--error)]"
      >
        계정 삭제
      </button>
      <ActionBottomSheet
        open={confirming}
        title="정말 계정을 삭제할까요?"
        description="모든 코스, 사진, 좋아요, 댓글, 팔로우가 영구 삭제되며 되돌릴 수 없어요."
        primaryLabel={pending ? "삭제 중…" : "영구 삭제"}
        secondaryLabel="취소"
        primaryTone="danger"
        pending={pending}
        onPrimary={onDelete}
        onClose={() => setConfirming(false)}
        ariaLabel="계정 삭제 확인"
      />
    </>
  );
}
