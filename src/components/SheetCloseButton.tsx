"use client";

/**
 * Top-right 닫기(X) for modal bottom sheets — an iOS-style soft circular button.
 * Map sheets are intentionally excluded (they close by dragging the handle).
 */
export default function SheetCloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="닫기"
      className="absolute right-3 top-3 z-[1] flex h-8 w-8 items-center justify-center rounded-full bg-muted text-ink-soft"
    >
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M6 6 18 18M18 6 6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    </button>
  );
}
