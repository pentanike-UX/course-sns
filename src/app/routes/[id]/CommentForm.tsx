"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { addComment } from "./actions";
import { useAuthGate } from "@/components/AuthGate";

export default function CommentForm({ routeId }: { routeId: string }) {
  const router = useRouter();
  const { requireAuth } = useAuthGate();
  const [body, setBody] = useState("");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pending) return;
    if (!requireAuth({ next: `/routes/${routeId}` })) return; // guest → login sheet
    if (!body.trim()) return;
    start(async () => {
      const res = await addComment(routeId, body);
      if (res?.error) {
        setError(res.error);
        if (res.needsAuth) requireAuth({ next: `/routes/${routeId}` });
      } else {
        setBody("");
        setError(null);
        router.refresh();
      }
    });
  };

  return (
    <form onSubmit={submit} className="space-y-2">
      <div className="flex items-end gap-2">
        <textarea
          value={body}
          onChange={(e) => {
            setBody(e.target.value);
            if (error) setError(null);
          }}
          placeholder="따라가기 팁이나 질문을 남겨 보세요"
          rows={1}
          className="min-h-[42px] flex-1 resize-none rounded-2xl border border-line bg-card px-3.5 py-2.5 text-[14px] text-ink outline-none placeholder:text-ink-faint focus:border-sunset"
        />
        <button
          type="submit"
          disabled={!body.trim() || pending}
          className="shrink-0 rounded-full bg-sunset px-4 py-2.5 text-[13px] font-semibold text-white disabled:opacity-40"
        >
          {pending ? "…" : "등록"}
        </button>
      </div>
      {error && (
        <p className="rounded-xl bg-error-soft px-3 py-2 text-[12px] text-error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
