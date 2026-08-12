"use client";

import { useAuthGate } from "@/components/AuthGate";

/** Guest comment entry — AuthGate sheet (transfer-value copy), not a cold /login link. */
export default function CommentLoginButton({ routeId }: { routeId: string }) {
  const { requireAuth } = useAuthGate();

  return (
    <button
      type="button"
      onClick={() =>
        requireAuth({
          next: `/routes/${routeId}`,
          title: "댓글을 남기려면 로그인이 필요해요",
          description:
            "로그인하면 다녀온 팁을 남기고, 이 코스를 따라갈 수도 있어요. 둘러보기는 계속해도 돼요.",
        })
      }
      className="block w-full rounded-2xl border border-line bg-card py-3 text-center text-[13px] font-semibold text-ink-soft"
    >
      로그인하고 댓글 남기기
    </button>
  );
}
