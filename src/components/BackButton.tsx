"use client";

import { useRouter } from "next/navigation";
import { hasInAppHistory } from "@/lib/nav-history";
import { useSlideOver } from "@/components/SlideOver";
import JellyButton from "@/components/JellyButton";
import GlassCircle from "@/components/GlassCircle";

/**
 * Header back/close button: pops history so the user returns to wherever
 * they opened this screen from (matching the OS back gesture); deep-linked
 * entries with no in-app history go to `fallback` instead. Use `icon="close"`
 * on forms/modals where "닫기" reads better than a back arrow.
 */
export default function BackButton({
  fallback,
  glass,
  icon = "back",
}: {
  fallback: string;
  glass?: boolean;
  icon?: "back" | "close";
}) {
  const router = useRouter();
  // When this header lives inside a <SlideOver> (a pushed full-page screen),
  // dismiss via its slide-out so back mirrors the slide-in instead of an
  // instant pop. Plain pages keep the direct history pop.
  const slide = useSlideOver();

  return (
    <JellyButton
      type="button"
      aria-label={icon === "close" ? "닫기" : "뒤로"}
      onClick={() => {
        if (slide) slide.close();
        else if (hasInAppHistory()) router.back();
        else router.replace(fallback);
      }}
      className="flex h-11 w-11 items-center justify-center"
    >
      <GlassCircle tone={glass ? "hero" : "solid"}>
        {icon === "close" ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="m6 6 12 12M18 6 6 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="m15 5-7 7 7 7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </GlassCircle>
    </JellyButton>
  );
}
