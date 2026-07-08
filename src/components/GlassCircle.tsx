import { type ReactNode } from "react";

/**
 * The 36pt "glass container" of an iOS 26 header icon button. It's wrapped by a
 * 44pt touch target (the clickable element) and holds a 20pt glyph, so the tap
 * area meets Apple's 44pt minimum while the visible chip stays compact.
 */
export default function GlassCircle({
  tone = "solid",
  children,
}: {
  /** "hero" = liquid glass over imagery; "solid" = subtle chip over paper */
  tone?: "solid" | "hero";
  children: ReactNode;
}) {
  const bg =
    tone === "hero"
      ? "bg-white/45 ring-1 ring-white/50 backdrop-blur-md dark:bg-black/35 dark:ring-white/20"
      : "bg-card/80 ring-1 ring-line/60";
  return (
    <span
      className={`flex h-9 w-9 items-center justify-center rounded-full text-ink shadow-sm ${bg}`}
    >
      {children}
    </span>
  );
}
