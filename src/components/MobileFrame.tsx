import { ReactNode } from "react";
import AppSplash from "@/components/AppSplash";

/**
 * MobileFrame
 * The app is designed mobile-first (~430px). On real mobile it fills the screen
 * edge-to-edge. On desktop the same UI is centered as a phone-like column.
 *
 * `shell` (tab roots + detail/view pages) makes the phone a self-contained
 * "device viewport": a fixed-height (`h-dvh`) column that clips its own overflow,
 * so the page's `flex-1 overflow-y-auto` content scrolls *inside* it on every
 * size. That internal scroll is what lets `position: sticky` headers/filters pin
 * to the top, and on desktop it keeps the column a stable viewport so `fixed`
 * chrome stays put. On desktop the column is also pushed right beside a brand
 * rail, and `lg:[transform]` makes it the containing block for its `fixed`
 * descendants (header, bottom nav, sheets, edge drawers) — they re-base to the
 * phone and `overflow-hidden` clips them so nothing spills onto the rail. Mobile
 * gets no transform/rail, just the internal-scroll viewport.
 */
export default function MobileFrame({
  children,
  shell = false,
  immersive = false,
}: {
  children: ReactNode;
  shell?: boolean;
  /**
   * For pages whose top content is full-bleed imagery (route detail hero). The
   * notch band becomes a light dark scrim instead of the opaque paper frost, so
   * the image reads edge-to-edge under the status bar (open feeling) while white
   * status-bar glyphs stay legible. Ignored without `shell`.
   */
  immersive?: boolean;
}) {
  if (!shell) {
    return (
      <div className="flex min-h-lvh justify-center">
        <div className="relative flex min-h-lvh w-full max-w-[430px] flex-col bg-paper shadow-[0_0_60px_rgba(0,0,0,0.08)] sm:my-0">
          {children}
          {/* Brand splash lives inside the frame column so it is always clipped to
              the phone (never escapes onto the desktop stage). Shown once per page
              load via a module flag in AppSplash. */}
          <AppSplash />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-lvh justify-center lg:gap-12 xl:gap-20">
      <BrandRail />
      {/* id=app-shell: portal target for body-portaled sheets so they land inside
          the phone frame (and inherit its desktop transform/clip) instead of the
          viewport. lg:[transform] makes this the containing block for descendant
          `fixed` chrome on desktop; lg:overflow-hidden clips their off-screen
          slides to the phone. Mobile gets neither, so it's unchanged.
          h-lvh (large viewport), not dvh: dvh can resolve shorter than the screen
          on iOS, leaving a dead paper strip above the home indicator (the app
          looked "shrunk"). lvh matches body's full height so the app fills edge to
          edge; the bottom safe area is handled by per-element padding (e.g. dock). */}
      <div
        id="app-shell"
        className="relative flex h-lvh w-full max-w-[430px] flex-col overflow-hidden bg-paper shadow-[0_0_60px_rgba(0,0,0,0.08)] lg:[transform:translateZ(0)]"
      >
        {children}
        {/* Notch / status-bar liquid glass: a frosted bar exactly the height of
            the top safe area, so content scrolling under the notch reads cleanly
            and any sticky chrome can sit just beneath it. bg-paper adapts to
            light/dark; height collapses to 0 on devices without a notch (and on
            desktop), so it's inert there. */}
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-x-0 top-0 z-40 h-[env(safe-area-inset-top)] ${
            immersive
              ? "bg-gradient-to-b from-black/30 to-transparent"
              : "bg-paper/70 backdrop-blur-lg backdrop-saturate-150"
          }`}
        />
        {/* Brand splash lives inside #app-shell so on desktop it inherits the
            phone's transform/clip and never escapes onto the stage or brand rail.
            Shown once per page load via a module flag in AppSplash. */}
        <AppSplash />
      </div>
    </div>
  );
}

/**
 * Desktop-only marketing rail. Hidden below lg so mobile is untouched.
 * Mental model: 코스 turns the path you walked into a course record, and a person's
 * profile into a "bookshelf" of their routes you can subscribe to.
 */
function BrandRail() {
  return (
    <aside className="hidden w-full max-w-sm shrink-0 flex-col justify-center px-10 py-16 lg:flex">
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icons/icon-512.png"
          alt="코스"
          width={48}
          height={48}
          className="rounded-[14px]"
        />
        <span className="text-2xl font-black tracking-tight text-sunset">코스</span>
      </div>

      <h1 className="mt-9 break-keep text-[2.6rem] font-black leading-[1.15] tracking-[-0.01em] text-ink">
        좋은 길을
        <br />
        따라갈 수 있게
      </h1>
      <p className="mt-5 max-w-[34ch] break-keep text-[15px] leading-relaxed text-ink-soft">
        스팟 · 이동 · 시간 · 팁까지, 다녀온 동선을 지도 위 하나의 코스로 남기세요. 마음에 든
        코스를 따라가고, 다녀온 후기가 다음 사람을 돕습니다.
      </p>

      <ul className="mt-9 space-y-4">
        <Pillar title="코스 발견" desc="지역·누구와·난이도로 따라갈 동선을 고르세요" />
        <Pillar title="따라가기" desc="장소와 이동을 내 초안으로 가져와 다듬어요" />
        <Pillar title="다녀온 영향" desc="후기와 팔로우가 다음 코스를 열어요" />
      </ul>

      <p className="mt-11 inline-flex items-center gap-2 text-[13px] font-medium text-ink-faint">
        오른쪽에서 바로 둘러보세요
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M5 12h14M13 6l6 6-6 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </p>
    </aside>
  );
}

function Pillar({ title, desc }: { title: string; desc: string }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-primary-soft text-sunset">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M5 13l4 4L19 7"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="leading-snug">
        <span className="block text-[15px] font-bold text-ink">{title}</span>
        <span className="block text-[13px] text-ink-soft">{desc}</span>
      </span>
    </li>
  );
}
