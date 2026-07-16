import BackButton from "@/components/BackButton";
import LargeTitleHeader from "@/components/LargeTitleHeader";

/** Sticky top bar. A back button (sub-pages), the brand wordmark (home only),
 *  or a big section title (tab roots). */
export default function AppHeader({
  title,
  back,
  left,
  right,
  transparent,
  glass,
  closeButton,
  large,
  brand,
}: {
  title?: string;
  /** shows a back button; the value is the deep-link fallback (history pops otherwise) */
  back?: string;
  /** custom leading control — overrides the default back/brand affordance (e.g. a
   *  close button that confirms before discarding unsaved edits) */
  left?: React.ReactNode;
  right?: React.ReactNode;
  transparent?: boolean;
  /** liquid-glass back button (for transparent headers over imagery) */
  glass?: boolean;
  /** render the back affordance as a 닫기(X) — for create/edit forms */
  closeButton?: boolean;
  /** iOS-style large title: the section title becomes the header, big and bold,
   *  with right actions on the same row. For tab roots only (no back button). */
  large?: boolean;
  /** show the 코스 wordmark — home only; every other screen drops it. */
  brand?: boolean;
}) {
  const isLarge = !!large && !!title && !back;
  const bg = transparent ? "bg-transparent" : "bg-paper/90 backdrop-blur";

  // Tab-root header: no wordmark, big section title that collapses on scroll.
  if (isLarge) {
    return <LargeTitleHeader title={title!} right={right} />;
  }

  return (
    <header
      className={`sticky top-0 z-20 flex h-[calc(env(safe-area-inset-top)+3.5rem)] items-center gap-2 px-3 pt-[env(safe-area-inset-top)] ${bg}`}
    >
      {left ? (
        left
      ) : back ? (
        <BackButton fallback={back} glass={glass} icon={closeButton ? "close" : "back"} />
      ) : brand ? (
        <span className="flex items-center gap-1.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/icon-512.png" alt="" width={24} height={24} className="rounded-[7px]" />
          <span className="text-xl font-black tracking-tight text-ink">코스</span>
        </span>
      ) : null}

      {title ? (
        <h1 className={`flex-1 truncate text-[15px] font-bold text-ink ${back || brand ? "" : "pl-1"}`}>
          {title}
        </h1>
      ) : (
        <div className="flex-1" />
      )}
      {right}
    </header>
  );
}
