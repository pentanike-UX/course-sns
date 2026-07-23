"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toggleFollow } from "@/app/u/[handle]/actions";
import { useAuthGate } from "@/components/AuthGate";

type Props = {
  followeeId: string;
  initialFollowing: boolean;
  /** whether this person follows the viewer (drives the 맞팔/서로 labels) */
  followsMe?: boolean;
  size?: "lg" | "sm";
};

/**
 * Follow/unfollow with optimistic toggle. The label encodes the relationship:
 *  - not following + they follow me → 맞팔로우
 *  - not following                  → 팔로우
 *  - following + they follow me      → 서로 팔로우
 *  - following                       → 팔로잉
 */
export default function FollowToggle({
  followeeId,
  initialFollowing,
  followsMe = false,
  size = "lg",
}: Props) {
  const router = useRouter();
  const { requireAuth } = useAuthGate();
  const [following, setFollowing] = useState(initialFollowing);
  const [, start] = useTransition();

  const FOLLOW_AUTH = {
    title: "팔로우하려면 로그인이 필요해요",
    description:
      "로그인하면 이 메이커의 새 코스를 보관함「팔로잉」에서 받아볼 수 있어요.",
  } as const;

  const onToggle = () => {
    if (!requireAuth(FOLLOW_AUTH)) return;
    const next = !following;
    setFollowing(next); // optimistic
    start(async () => {
      const res = await toggleFollow(followeeId, next);
      if (res?.error) {
        setFollowing(!next);
        if (res.needsAuth) requireAuth(FOLLOW_AUTH);
      } else {
        router.refresh();
      }
    });
  };

  const label = following
    ? followsMe
      ? "서로 팔로우"
      : "팔로잉"
    : followsMe
      ? "맞팔로우"
      : "팔로우";

  const sizeCls =
    size === "sm" ? "px-3.5 py-1.5 text-[13px]" : "px-6 py-2 text-[14px]";

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={following}
      className={`shrink-0 rounded-full font-semibold transition-colors ${sizeCls} ${
        following
          ? "border border-line bg-card text-ink-soft"
          : "bg-sunset text-white"
      }`}
    >
      {label}
    </button>
  );
}
