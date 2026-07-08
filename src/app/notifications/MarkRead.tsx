"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { markNotificationsRead } from "./actions";

/** Marks notifications read on mount (refreshes so the bell badge clears). */
export default function MarkRead({ hasUnread }: { hasUnread: boolean }) {
  const router = useRouter();
  const done = useRef(false);

  useEffect(() => {
    if (done.current || !hasUnread) return;
    done.current = true;
    markNotificationsRead().then(() => router.refresh());
  }, [hasUnread, router]);

  return null;
}
