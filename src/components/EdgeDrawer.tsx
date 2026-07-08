"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import SlideDrawer from "@/components/SlideDrawer";
import GlassCircle from "@/components/GlassCircle";

/**
 * Routed edge drawer (/feed, /profile intercepts). Slides in on mount and slides
 * out before navigating away so the exit motion is always visible.
 */
export default function EdgeDrawer({
  side = "left",
  headerRight,
  children,
  deferBody = false,
  bodyPlaceholder,
}: {
  side?: "left" | "right";
  headerRight?: ReactNode;
  children: ReactNode;
  deferBody?: boolean;
  bodyPlaceholder?: ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(true);

  const dismiss = () => setOpen(false);

  const onClosed = () => {
    if (window.history.length > 1) router.back();
    else router.push("/");
  };

  return (
    <SlideDrawer
      open={open}
      onClosed={onClosed}
      side={side}
      zIndex={50}
      deferBody={deferBody}
      bodyPlaceholder={bodyPlaceholder}
      onDismiss={dismiss}
      header={
        <header className="flex h-[calc(env(safe-area-inset-top)+3.5rem)] shrink-0 items-center justify-between gap-2 px-3 pt-[env(safe-area-inset-top)]">
          <button
            type="button"
            onClick={dismiss}
            aria-label="닫기"
            className="flex h-11 w-11 items-center justify-center"
          >
            <GlassCircle>
              <CloseIcon />
            </GlassCircle>
          </button>
          {headerRight}
        </header>
      }
    >
      {children}
    </SlideDrawer>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 6 18 18M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
