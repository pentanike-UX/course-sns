"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { deleteComment } from "./actions";

export default function DeleteCommentButton({
  commentId,
  routeId,
}: {
  commentId: string;
  routeId: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const onDelete = () =>
    start(async () => {
      const res = await deleteComment(commentId, routeId);
      if (!res?.error) router.refresh();
    });

  return (
    <button
      type="button"
      onClick={onDelete}
      disabled={pending}
      className="text-[11px] text-ink-faint disabled:opacity-50"
    >
      삭제
    </button>
  );
}
