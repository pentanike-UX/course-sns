"use client";

import type { ReactNode } from "react";

/**
 * iPhone “홈 화면에 추가” 안내. Safari는 자동 설치 프롬프트가 없어서
 * 공유 시트 경로를 그림으로 보여 준다. (PHOTO-FIRST / PWA 설치)
 */
export default function IosHomeScreenGuide() {
  const safari = isIosSafari();

  return (
    <ol className="mt-4 space-y-3">
      {!safari && (
        <li className="rounded-2xl bg-sunset-wash/70 px-3.5 py-3 text-[13px] leading-relaxed text-sunset-ink">
          Chrome·인앱 브라우저보다 <span className="font-bold">Safari</span>에서 여는 게
          가장 확실해요. 공유 시트에서 Safari로 연 뒤 아래 순서를 따라 주세요.
        </li>
      )}
      <GuideStep
        n={1}
        title={safari ? "아래 공유 버튼을 눌러 주세요" : "공유 버튼을 눌러 주세요"}
        hint={
          safari
            ? "Safari 화면 맨 아래, 가운데 위로 올라가는 화살표예요."
            : "주소창 옆 공유 아이콘을 누르면 같은 시트가 열려요."
        }
      >
        {safari ? <SafariToolbarVisual /> : <GenericShareVisual />}
      </GuideStep>
      <GuideStep
        n={2}
        title="‘홈 화면에 추가’를 눌러 주세요"
        hint="목록을 아래로 조금 내리면 보여요."
      >
        <AddToHomeRowVisual />
      </GuideStep>
      <GuideStep
        n={3}
        title="오른쪽 위 ‘추가’를 눌러 주세요"
        hint="이름은 coursee로 나와요. 한 번만 하면 다음부터 홈 화면에서 바로 열려요."
      >
        <AddConfirmVisual />
      </GuideStep>
    </ol>
  );
}

function GuideStep({
  n,
  title,
  hint,
  children,
}: {
  n: number;
  title: string;
  hint: string;
  children: ReactNode;
}) {
  return (
    <li className="overflow-hidden rounded-[18px] bg-muted ring-1 ring-line/70">
      <div className="flex items-start gap-2.5 px-3.5 pt-3">
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink text-[12px] font-black text-paper">
          {n}
        </span>
        <div className="min-w-0 flex-1 pb-1">
          <p className="text-[14px] font-bold leading-snug text-ink">{title}</p>
          <p className="mt-0.5 text-[12px] leading-relaxed text-ink-soft">{hint}</p>
        </div>
      </div>
      <div className="px-3 pb-3 pt-1.5">{children}</div>
    </li>
  );
}

/** Safari 하단 툴바 — 공유 버튼을 하이라이트. */
function SafariToolbarVisual() {
  return (
    <div className="rounded-2xl bg-card px-2.5 pb-2 pt-2 shadow-[var(--shadow-sm)] ring-1 ring-line/80">
      <div className="flex items-end justify-between px-1">
        <ToolbarGlyph name="back" />
        <ToolbarGlyph name="forward" muted />
        <div className="flex flex-col items-center gap-1">
          <span className="rounded-full bg-sunset px-2 py-0.5 text-[10px] font-bold leading-none text-white">
            여기
          </span>
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sunset-wash ring-2 ring-sunset">
            <IosShareGlyph className="text-sunset" />
          </span>
        </div>
        <ToolbarGlyph name="book" />
        <ToolbarGlyph name="tabs" />
      </div>
      <p className="mt-1.5 text-center text-[11px] font-medium text-ink-faint">Safari 하단 바</p>
    </div>
  );
}

function GenericShareVisual() {
  return (
    <div className="rounded-2xl bg-card px-3 py-3 shadow-[var(--shadow-sm)] ring-1 ring-line/80">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-sunset-wash ring-2 ring-sunset">
          <IosShareGlyph className="text-sunset" />
        </span>
        <div>
          <p className="text-[13px] font-bold text-ink">공유</p>
          <p className="text-[11px] text-ink-faint">네모에서 화살표가 올라가는 아이콘</p>
        </div>
      </div>
    </div>
  );
}

function AddToHomeRowVisual() {
  return (
    <div className="overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-sm)] ring-2 ring-sunset">
      <div className="flex items-center gap-3 px-3 py-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-[9px] bg-muted ring-1 ring-line">
          <AddToHomeGlyph />
        </span>
        <span className="flex-1 text-[15px] font-semibold text-ink">홈 화면에 추가</span>
        <span className="rounded-full bg-sunset px-2 py-0.5 text-[10px] font-bold text-white">여기</span>
      </div>
    </div>
  );
}

function AddConfirmVisual() {
  return (
    <div className="overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-sm)] ring-1 ring-line/80">
      <div className="flex items-center justify-between px-3 py-2.5">
        <span className="text-[13px] font-medium text-ink-faint">취소</span>
        <span className="text-[13px] font-bold text-ink">coursee</span>
        <span className="rounded-full bg-sunset px-2.5 py-0.5 text-[12px] font-bold text-white">추가</span>
      </div>
      <div className="flex items-center gap-3 border-t border-line/70 bg-muted/60 px-3 py-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-ink text-[15px] font-black text-paper">
          C
        </span>
        <div>
          <p className="text-[14px] font-bold text-ink">coursee</p>
          <p className="text-[11px] text-ink-faint">course-sns.vercel.app</p>
        </div>
      </div>
    </div>
  );
}

function ToolbarGlyph({ name, muted }: { name: "back" | "forward" | "book" | "tabs"; muted?: boolean }) {
  const cls = muted ? "text-ink-faint" : "text-ink-soft";
  return (
    <span className={`flex h-9 w-9 items-center justify-center ${cls}`} aria-hidden>
      {name === "back" && (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M15 5 8 12l7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {name === "forward" && (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="m9 5 7 7-7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {name === "book" && (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M6 5.5h5.5A2.5 2.5 0 0 1 14 8v11H8.5A2.5 2.5 0 0 1 6 16.5V5.5Z" stroke="currentColor" strokeWidth="1.8" />
          <path d="M14 8h4a2 2 0 0 1 2 2v9.5h-6V8Z" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      )}
      {name === "tabs" && (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <rect x="5" y="7" width="11" height="13" rx="2" stroke="currentColor" strokeWidth="1.8" />
          <path d="M8 7V6a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-1" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      )}
    </span>
  );
}

function IosShareGlyph({ className = "text-ink" }: { className?: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M12 4v10M12 4l-3.2 3.2M12 4l3.2 3.2"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7 11v6.5A2.5 2.5 0 0 0 9.5 20h5A2.5 2.5 0 0 0 17 17.5V11"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
      />
    </svg>
  );
}

function AddToHomeGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden className="text-ink">
      <rect x="4" y="4" width="16" height="16" rx="3.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function isIosSafari() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const iOS =
    /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (!iOS) return false;
  const notSafari = /CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo|YaBrowser/.test(ua);
  return /Safari/.test(ua) && !notSafari;
}
