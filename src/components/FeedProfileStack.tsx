"use client";

import { useState, type ReactNode } from "react";
import EdgeDrawer from "@/components/EdgeDrawer";
import SlideDrawer from "@/components/SlideDrawer";
import DiaryDrawerSkeleton from "@/components/DiaryDrawerSkeleton";
import GlassCircle from "@/components/GlassCircle";
import { useOverlayHistory } from "@/lib/use-overlay-history";

/**
 * The 내 일기 (feed) drawer with profile stacked on top as a live overlay —
 * no route change, so feed scroll/state stays mounted beneath.
 */
export default function FeedProfileStack({
  notificationBell,
  profileActions,
  profileContent,
  children,
}: {
  notificationBell: ReactNode;
  profileActions: ReactNode;
  profileContent: ReactNode;
  children: ReactNode;
}) {
  const [profileOpen, setProfileOpen] = useState(false);
  const { openOverlay: openProfileBase, requestClose: closeProfile } = useOverlayHistory(
    profileOpen,
    setProfileOpen,
    "rdProfileOverlay",
  );
  const openProfile = () => {
    if (profileOpen) return;
    openProfileBase();
  };

  return (
    <>
      <EdgeDrawer
        deferBody
        bodyPlaceholder={<DiaryDrawerSkeleton />}
        headerRight={
          <div className="flex items-center">
            {notificationBell}
            <button
              type="button"
              onClick={openProfile}
              aria-label="설정"
              className="flex h-11 w-11 items-center justify-center text-ink-soft"
            >
              <GlassCircle>
                <SettingsIcon />
              </GlassCircle>
            </button>
          </div>
        }
      >
        {children}
      </EdgeDrawer>

      <SlideDrawer
        open={profileOpen}
        side="right"
        zIndex={60}
        keepAlive
        onDismiss={closeProfile}
        ariaLabel="설정"
        header={
          <header className="flex h-[calc(env(safe-area-inset-top)+3.5rem)] shrink-0 items-center justify-between gap-2 px-3 pt-[env(safe-area-inset-top)]">
            <button
              type="button"
              onClick={closeProfile}
              aria-label="닫기"
              className="flex h-11 w-11 items-center justify-center"
            >
              <GlassCircle>
                <CloseIcon />
              </GlassCircle>
            </button>
            {profileActions}
          </header>
        }
      >
        {profileContent}
      </SlideDrawer>
    </>
  );
}

function SettingsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M19.4 13a7.6 7.6 0 0 0 0-2l1.7-1.3-1.9-3.3-2 .8a7.6 7.6 0 0 0-1.7-1l-.3-2.1H9.8l-.3 2.1a7.6 7.6 0 0 0-1.7 1l-2-.8L3.9 9.7 5.6 11a7.6 7.6 0 0 0 0 2l-1.7 1.3 1.9 3.3 2-.8c.5.4 1.1.7 1.7 1l.3 2.1h4.4l.3-2.1c.6-.3 1.2-.6 1.7-1l2 .8 1.9-3.3L19.4 13Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 6 18 18M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
