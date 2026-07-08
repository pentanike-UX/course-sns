"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import ActionBottomSheet from "@/components/ActionBottomSheet";
import { useAuthGate } from "@/components/AuthGate";
import { growHold, releaseSettle } from "@/lib/jelly-tap";

type Tab = {
  href: string;
  label: string;
  icon: (active: boolean) => React.ReactNode;
};

// Active tabs swap to a solid (filled) glyph — the "몽글몽글" pop — while idle
// tabs stay as light outlines. Fill colour is the brand sunset on active.
const ACTIVE = "var(--sunset)";
const IDLE = "var(--ink-soft)";

const homeIcon = (a: boolean) =>
  a ? (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={ACTIVE}>
      <path d="M12 2.8 2.4 11.1a1.3 1.3 0 0 0-.4 1V19.5A1.5 1.5 0 0 0 3.5 21H9.5v-5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v5h6A1.5 1.5 0 0 0 22 19.5V12.1a1.3 1.3 0 0 0-.4-1L12 2.8Z" />
    </svg>
  ) : (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M3 10.5 12 4l9 6.5M5 9.5V19a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5"
        stroke={IDLE}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );


const mapIcon = (a: boolean) =>
  a ? (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={ACTIVE}>
      <path d="M9 4 3.5 5.8A1 1 0 0 0 3 6.7v12.1a1 1 0 0 0 1.32.95L9 18l6 2 5.18-1.73A1 1 0 0 0 21 17.3V5.2a1 1 0 0 0-1.32-.95L15 6 9 4Z" />
    </svg>
  ) : (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Zm0 0v14m6-12v14"
        stroke={IDLE}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );

// 보관함 → heart (shares the path used by the library "좋아요" empty state).
const HEART_PATH =
  "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z";

const libraryIcon = (a: boolean) =>
  a ? (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={ACTIVE}>
      <path d={HEART_PATH} />
    </svg>
  ) : (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d={HEART_PATH} stroke={IDLE} strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );

const tabs: Tab[] = [
  { href: "/", label: "홈", icon: homeIcon },
  { href: "/?mode=map", label: "지도", icon: mapIcon },
  { href: "/library", label: "보관함", icon: libraryIcon },
];

const reduceMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Breathing room kept on every side between the bar and the focus blob (matches
// the original top/bottom gap of (60−48)/2 = 6px). The blob fills its third
// minus this gap, so the focus reads large but never touches the bar edges.
const BLOB_GAP = 6;

/** Grow-and-hold while the finger is down, then bounce back on release — the
 *  same jelly press as the functional buttons (lib/jelly-tap). Spread onto each
 *  tab/record Link so the press stays visible from under a fingertip. */
const pressBounce = {
  onPointerDown: (e: React.PointerEvent) => growHold(e.currentTarget as HTMLElement),
  onPointerUp: (e: React.PointerEvent) => void releaseSettle(e.currentTarget as HTMLElement),
  onPointerLeave: (e: React.PointerEvent) => void releaseSettle(e.currentTarget as HTMLElement),
  onPointerCancel: (e: React.PointerEvent) => void releaseSettle(e.currentTarget as HTMLElement),
};

/**
 * Build an edge-refraction displacement map for a rounded bar: R encodes the
 * x-shift, G the y-shift. Both stay neutral (128) in the center and ramp up
 * only inside a `bezel`-wide band at each edge (smoothstep), so feDisplacementMap
 * bends the backdrop like a glass lens at the rim — the clean iOS look (no noise).
 */
function buildEdgeDisplacementMap(w: number, h: number, bezel: number): string {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  const img = ctx.createImageData(w, h);
  const d = img.data;
  const smooth = (k: number) => k * k * (3 - 2 * k);
  // -1 at the near edge → 0 by the end of the bezel band → +1 at the far edge
  const profile = (t: number, band: number) => {
    if (t < band) return -smooth(1 - t / band);
    if (t > 1 - band) return smooth((t - (1 - band)) / band);
    return 0;
  };
  const bandX = Math.min(0.49, bezel / w);
  const bandY = Math.min(0.49, bezel / h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = profile((x + 0.5) / w, bandX);
      const dy = profile((y + 0.5) / h, bandY);
      const i = (y * w + x) * 4;
      d[i] = 128 + dx * 127; // R → x displacement
      d[i + 1] = 128 + dy * 127; // G → y displacement
      d[i + 2] = 128;
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas.toDataURL();
}

export default function BottomNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { requireAuth } = useAuthGate();
  const [createOpen, setCreateOpen] = useState(false);
  const [createIntent, setCreateIntent] = useState<"record" | "plan">("record");
  // 지도 lives at "/?mode=map" — when it's open the whole nav drops away and the
  // 지도 tab (not 홈) reads as active so the selection blob slides to it first.
  const mapMode = pathname === "/" && searchParams.get("mode") === "map";
  const isActive = (href: string) => {
    if (href === "/?mode=map") return mapMode;
    if (href === "/") return pathname === "/" && !mapMode;
    return pathname.startsWith(href);
  };
  const activeIndex = Math.max(
    0,
    tabs.findIndex((t) => isActive(t.href)),
  );

  const blobRef = useRef<HTMLSpanElement>(null);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const iconRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const prevXRef = useRef<number | null>(null);
  const lastScrollYRef = useRef(0);
  const tickingRef = useRef(false);
  const [navHidden, setNavHidden] = useState(false);

  // Liquid-glass edge refraction (Chromium: backdrop-filter url()). The map is
  // sized to the bar so the refraction band hugs the actual rim. Falls back to
  // the frosted background where SVG backdrop filters aren't applied.
  const barRef = useRef<HTMLUListElement>(null);
  const [glass, setGlass] = useState<{ map: string; w: number; h: number } | null>(null);
  useEffect(() => {
    // The SVG-displacement refraction is Chromium-only and re-composites the
    // backdrop every frame the page scrolls — too costly on touch devices (and
    // it wouldn't render on iOS Safari anyway). Enable it only where there's a
    // precise pointer (desktop); touch falls back to the cheap frosted bar.
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const build = () => {
      const bar = barRef.current;
      if (!bar) return;
      const w = Math.round(bar.clientWidth);
      const h = Math.round(bar.clientHeight);
      if (w < 2 || h < 2) return;
      setGlass({ map: buildEdgeDisplacementMap(w, h, 22), w, h });
    };
    build();
    window.addEventListener("resize", build);
    return () => window.removeEventListener("resize", build);
  }, []);

  // Slide the single jelly blob to the active tab, stretching along the travel
  // direction (liquid morph) and settling with an overshoot spring. The blob
  // fills its third minus BLOB_GAP on every side (a large focus that keeps the
  // same breathing room as the top/bottom gap).
  useEffect(() => {
    const blob = blobRef.current;
    const li = itemRefs.current[activeIndex];
    if (!blob || !li) return;

    const width = Math.max(0, li.offsetWidth - BLOB_GAP * 2);
    blob.style.width = `${width}px`;
    const target = li.offsetLeft + BLOB_GAP; // == li center − width/2

    const from = prevXRef.current;
    prevXRef.current = target;

    const settle = `translate(${target}px, -50%) scale(1, 1)`;
    blob.style.transform = settle;
    blob.style.opacity = "1";

    if (from == null || from === target || reduceMotion()) return;

    const mid = (from + target) / 2;
    const dist = Math.abs(target - from);
    // farther jump → more stretch; squash vertically for a juicier jelly morph
    const stretch = Math.min(1 + dist / 55, 2.3);
    const squash = Math.max(0.74, 1 - dist / 320);
    blob.animate(
      [
        { transform: `translate(${from}px, -50%) scale(1, 1)` },
        { transform: `translate(${mid}px, -50%) scale(${stretch}, ${squash})`, offset: 0.5 },
        { transform: settle },
      ],
      { duration: 580, easing: "cubic-bezier(.34,1.62,.46,1)" },
    );
  }, [activeIndex]);

  // keep the blob aligned + sized if the viewport width changes (no animation)
  useEffect(() => {
    const onResize = () => {
      const blob = blobRef.current;
      const li = itemRefs.current[activeIndex];
      if (!blob || !li) return;
      const width = Math.max(0, li.offsetWidth - BLOB_GAP * 2);
      blob.style.width = `${width}px`;
      const x = li.offsetLeft + BLOB_GAP;
      prevXRef.current = x;
      blob.style.transform = `translate(${x}px, -50%) scale(1, 1)`;
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [activeIndex]);

  // A quick squash-and-settle on the whole bar whenever a tab is pressed — the
  // dock itself reacts jelly-like alongside the focus blob.
  const pulseBar = () => {
    const bar = barRef.current;
    if (!bar || reduceMotion()) return;
    bar.animate(
      [
        { transform: "scale(1, 1)" },
        { transform: "scale(1.02, 0.9)", offset: 0.4 },
        { transform: "scale(0.99, 1.03)", offset: 0.72 },
        { transform: "scale(1, 1)" },
      ],
      { duration: 460, easing: "cubic-bezier(.34,1.55,.5,1)" },
    );
  };

  useEffect(() => {
    lastScrollYRef.current = currentScrollY();
    const frame = window.requestAnimationFrame(() => setNavHidden(false));
    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  useEffect(() => {
    const update = () => {
      tickingRef.current = false;
      const y = currentScrollY();
      const diff = y - lastScrollYRef.current;
      lastScrollYRef.current = y;

      if (Math.abs(diff) < 8) return;
      if (y < 36 || diff < 0) {
        setNavHidden(false);
        return;
      }
      if (diff > 0 && y > 72) {
        setNavHidden(true);
      }
    };
    const onScroll = () => {
      if (tickingRef.current) return;
      tickingRef.current = true;
      window.requestAnimationFrame(update);
    };

    lastScrollYRef.current = currentScrollY();
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("scroll", onScroll, { passive: true, capture: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("scroll", onScroll, { capture: true });
      window.removeEventListener("resize", onScroll);
      if (tickingRef.current) {
        tickingRef.current = false;
      }
    };
  }, []);

  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-[430px] items-center gap-3 px-4 pb-[max(env(safe-area-inset-bottom),16px)]">
      {/* edge-refraction filter (Chromium backdrop-filter url()) */}
      {glass && (
        <svg aria-hidden width="0" height="0" className="absolute">
          <filter
            id="nav-liquid-glass"
            x="0"
            y="0"
            width="100%"
            height="100%"
            colorInterpolationFilters="sRGB"
          >
            <feImage
              href={glass.map}
              x="0"
              y="0"
              width={glass.w}
              height={glass.h}
              preserveAspectRatio="none"
              result="map"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="map"
              scale="38"
              xChannelSelector="R"
              yChannelSelector="G"
              result="refracted"
            />
            <feGaussianBlur in="refracted" stdDeviation="1.2" />
          </filter>
        </svg>
      )}

      {/* one liquid-glass bar holding all four icon-only tabs */}
      <ul
        ref={barRef}
        aria-hidden={navHidden || mapMode}
        className={`relative flex h-[60px] flex-1 items-center overflow-hidden rounded-full bg-gradient-to-b from-[rgba(244,246,245,0.5)] to-[rgba(230,234,232,0.42)] shadow-[0_10px_30px_rgba(0,0,0,0.22),0_0_0_1px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-lg backdrop-saturate-150 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform dark:from-[rgba(34,45,40,0.62)] dark:to-[rgba(16,23,20,0.55)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.55),0_0_0_1px_rgba(255,255,255,0.06),inset_0_1px_0_rgba(255,255,255,0.12)] ${
          navHidden ? "translate-y-[calc(100%+max(env(safe-area-inset-bottom),16px)+28px)]" : "translate-y-0"
        } ${navHidden || mapMode ? "pointer-events-none" : "pointer-events-auto"}`}
      >
        {/* refraction layer — bends the backdrop at the rim (Chromium only) */}
        {glass && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 z-0 rounded-full"
            style={{
              backdropFilter: "url(#nav-liquid-glass)",
              WebkitBackdropFilter: "url(#nav-liquid-glass)",
            }}
          />
        )}
        {/* the jelly selection blob — fills the active third (minus BLOB_GAP),
            sliding + stretching between tabs. Width is set in JS from the third. */}
        <span
          ref={blobRef}
          aria-hidden
          className="pointer-events-none absolute left-0 top-1/2 z-0 h-12 rounded-full bg-white opacity-0 shadow-[0_2px_6px_rgba(0,0,0,0.18)] ring-1 ring-black/[0.04] will-change-transform dark:bg-white/15 dark:ring-white/10"
          style={{ transformOrigin: "center" }}
        />
        {tabs.map((t, i) => {
          const active = isActive(t.href);
          const pressIcon = () => {
            const icon = iconRefs.current[i];
            if (icon) growHold(icon);
            pulseBar();
          };
          const releaseIcon = () => {
            const icon = iconRefs.current[i];
            if (icon) void releaseSettle(icon);
          };
          return (
            <li key={t.href} ref={(el) => { itemRefs.current[i] = el; }} className="relative z-10 flex flex-1 justify-center">
              <Link
                href={t.href}
                prefetch
                aria-label={t.label}
                aria-current={active ? "page" : undefined}
                tabIndex={navHidden || mapMode ? -1 : undefined}
                onPointerDown={pressIcon}
                onPointerUp={releaseIcon}
                onPointerLeave={releaseIcon}
                onPointerCancel={releaseIcon}
                onClick={(e) => {
                  // 보관함 is personal — guests get the login sheet, not a redirect
                  if (t.href === "/library" && !requireAuth({ next: "/library" })) {
                    e.preventDefault();
                  }
                }}
                className="flex h-12 w-full items-center justify-center rounded-full"
              >
                <span
                  ref={(el) => { iconRefs.current[i] = el; }}
                  className="jelly flex h-12 w-12 items-center justify-center will-change-transform"
                >
                  {t.icon(active)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      {/* record action — same height as the bar, aligned to its right */}
      <button
        type="button"
        aria-label="새 루트 만들기"
        onClick={() => {
          // 일기 등록·계획 — guests get the login sheet first
          if (!requireAuth({ next: "/routes/new" })) return;
          setCreateIntent("record");
          setCreateOpen(true);
        }}
        {...pressBounce}
        className={`jelly pointer-events-auto flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-full backdrop-blur-xl backdrop-saturate-150 transition-[background-color,box-shadow,color,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ring-1 ${
          navHidden
            ? "bg-white/34 text-ink shadow-[0_10px_24px_rgba(15,23,42,0.18),0_0_0_1px_rgba(255,255,255,0.52),inset_0_1px_0_rgba(255,255,255,0.78)] ring-white/60 dark:bg-black/34 dark:text-white dark:ring-white/15"
            : "bg-sunset text-white shadow-[0_10px_24px_rgba(22,163,74,0.45),0_0_0_1px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.5)] ring-white/50"
        }`}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
        </svg>
      </button>

      <ActionBottomSheet
        open={createOpen}
        title="무엇을 만들까요?"
        description="다녀온 하루는 기록으로, 앞으로 갈 곳은 계획으로 시작해요."
        primaryLabel={createIntent === "plan" ? "계획 시작하기" : "기록 시작하기"}
        secondaryLabel="취소"
        onClose={() => setCreateOpen(false)}
        onPrimary={() => {
          setCreateOpen(false);
          router.push(createIntent === "plan" ? "/routes/new?type=plan" : "/routes/new");
        }}
      >
        <div className="mt-4 grid gap-2">
          <CreateOption
            selected={createIntent === "record"}
            title="여행 기록하기"
            body="사진을 올리고 장소와 감상을 정리해요."
            icon={<RecordIcon />}
            onClick={() => setCreateIntent("record")}
          />
          <CreateOption
            selected={createIntent === "plan"}
            title="여행 계획하기"
            body="가고 싶은 곳을 모아 지도 위 동선으로 짜요."
            icon={<PlanIcon />}
            onClick={() => setCreateIntent("plan")}
          />
        </div>
      </ActionBottomSheet>
    </nav>
  );
}

function CreateOption({
  selected,
  title,
  body,
  icon,
  onClick,
}: {
  selected: boolean;
  title: string;
  body: string;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-3 rounded-[var(--radius-card)] border p-3 text-left ${
        selected ? "border-sunset bg-sunset-wash/55" : "border-line bg-card"
      }`}
    >
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
          selected ? "bg-sunset text-white" : "bg-muted text-ink-soft"
        }`}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-black text-ink">{title}</span>
        <span className="mt-0.5 block text-[12px] leading-relaxed text-ink-faint">{body}</span>
      </span>
      <span
        className={`h-5 w-5 rounded-full border ${
          selected ? "border-sunset bg-sunset shadow-[inset_0_0_0_4px_white]" : "border-line"
        }`}
        aria-hidden
      />
    </button>
  );
}

function RecordIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M7 4.5h10a2 2 0 0 1 2 2V20l-7-3-7 3V6.5a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M8.5 8.5h7M8.5 12h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function PlanIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="m9 18-5 2V6l5-2 6 2 5-2v14l-5 2-6-2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 4v14M15 6v14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function currentScrollY() {
  const documentY = window.scrollY || document.documentElement.scrollTop || 0;
  const main = document.querySelector<HTMLElement>("[data-tabs-scroll-root]");
  return Math.max(documentY, main?.scrollTop ?? 0);
}
