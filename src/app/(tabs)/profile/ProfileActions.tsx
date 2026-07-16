"use client";

import { useCallback, useEffect, useState } from "react";
import ActionBottomSheet from "@/components/ActionBottomSheet";
import JellyButton from "@/components/JellyButton";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};
type InstallSheetKind = "install" | "manual" | "installed";
const ACTION_ICON_SIZE = 20;
const ACTION_ICON_STROKE = 2.05;

export default function ProfileActions() {
  const [notice, setNotice] = useState<string | null>(null);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installSheet, setInstallSheet] = useState<InstallSheetKind | null>(null);
  const [installed, setInstalled] = useState(false);
  const [updating, setUpdating] = useState(false);

  const flash = useCallback((message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 1600);
  }, []);

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
      setInstalled(false);
    };
    const onInstalled = () => {
      setInstalled(true);
      setInstallPrompt(null);
      setInstallSheet(null);
      flash("홈 화면에 설치했어요");
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [flash]);

  const openInstallSheet = () => {
    if (installed || isStandaloneApp()) {
      setInstalled(true);
      setInstallSheet("installed");
      return;
    }

    if (!installPrompt) {
      setInstallSheet("manual");
      return;
    }

    setInstallSheet("install");
  };

  const installApp = async () => {
    if (!installPrompt) {
      setInstallSheet("manual");
      return;
    }

    try {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      setInstallPrompt(null);
      setInstallSheet(null);
      if (choice.outcome === "accepted") {
        flash("설치를 시작했어요");
      } else {
        flash("설치를 취소했어요");
      }
    } catch {
      setInstallSheet("manual");
    }
  };

  const shareApp = async () => {
    const url = `${window.location.origin}/`;
    const data = {
      title: "코스",
      text: "맘에 드는 코스 따라가 보고, 다녀온 팁도 남겨 보세요",
      url,
    };

    if (navigator.share) {
      try {
        await navigator.share(data);
        return;
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
      }
    }

    try {
      await copyText(url);
      flash("앱 링크를 복사했어요");
    } catch {
      flash("공유를 다시 시도해 주세요");
    }
  };

  const updateApp = async () => {
    if (updating) return;
    setUpdating(true);
    flash("최신 화면으로 다시 불러와요");
    try {
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.update().catch(() => undefined)));
      }
    } finally {
      window.setTimeout(() => window.location.reload(), 250);
    }
  };

  return (
    <>
      <div className="flex items-center">
        <JellyButton
          type="button"
          onClick={openInstallSheet}
          aria-label={installed ? "앱 설치됨" : "홈 화면에 앱 설치"}
          title={installed ? "앱 설치됨" : "홈 화면에 앱 설치"}
          className="flex h-11 w-11 items-center justify-center"
        >
          <span
            className={`flex h-9 w-9 items-center justify-center rounded-full border shadow-[var(--shadow-sm)] ${
              installed
                ? "border-line bg-muted text-ink-faint"
                : "border-line bg-card text-ink-soft"
            }`}
          >
            <InstallIcon installed={installed} />
          </span>
        </JellyButton>
        <JellyButton
          type="button"
          onClick={shareApp}
          aria-label="앱 공유하기"
          title="앱 공유하기"
          className="flex h-11 w-11 items-center justify-center"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-card text-ink-soft shadow-[var(--shadow-sm)]">
            <ShareIcon />
          </span>
        </JellyButton>
        <JellyButton
          type="button"
          onClick={updateApp}
          aria-label="앱 업데이트"
          title="앱 업데이트"
          disabled={updating}
          className="flex h-11 w-11 items-center justify-center disabled:opacity-50"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-card text-ink-soft shadow-[var(--shadow-sm)]">
            <RefreshIcon spinning={updating} />
          </span>
        </JellyButton>
      </div>
      <InstallSheet
        kind={installSheet}
        onClose={() => setInstallSheet(null)}
        onInstall={installApp}
      />
      {notice && (
        <div className="fixed inset-x-0 top-[calc(env(safe-area-inset-top)+4rem)] z-50 flex justify-center">
          <div className="rounded-full bg-ink px-4 py-2 text-[12px] font-semibold text-paper shadow-lg">
            {notice}
          </div>
        </div>
      )}
    </>
  );
}

function isStandaloneApp() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function InstallSheet({
  kind,
  onClose,
  onInstall,
}: {
  kind: InstallSheetKind | null;
  onClose: () => void;
  onInstall: () => void;
}) {
  if (!kind) return null;
  const isApple = isAppleDevice();

  if (kind === "installed") {
    return (
      <ActionBottomSheet
        open
        title="이미 앱으로 설치돼 있어요"
        description="홈 화면의 코스 아이콘으로 열면 주소창 없이 앱처럼 사용할 수 있어요."
        primaryLabel="확인"
        onPrimary={onClose}
        onClose={onClose}
        ariaLabel="앱 설치 상태 안내"
      />
    );
  }

  if (kind === "manual") {
    return (
      <ActionBottomSheet
        open
        title="홈 화면에 추가해 주세요"
        description="현재 브라우저는 자동 설치 버튼을 제공하지 않아요. 아래 경로로 한 번만 추가하면 다음부터 앱처럼 바로 열 수 있어요."
        primaryLabel="확인"
        onPrimary={onClose}
        onClose={onClose}
        ariaLabel="홈 화면 앱 설치 안내"
      >
        <ul className="mt-4 space-y-2 text-[13px] text-ink-soft">
          {isApple ? (
            <>
              <SheetGuideItem>Safari 하단 공유 버튼을 눌러 주세요</SheetGuideItem>
              <SheetGuideItem>목록에서 홈 화면에 추가를 선택해 주세요</SheetGuideItem>
            </>
          ) : (
            <>
              <SheetGuideItem>브라우저 메뉴를 열어 주세요</SheetGuideItem>
              <SheetGuideItem>앱 설치 또는 홈 화면에 추가를 선택해 주세요</SheetGuideItem>
            </>
          )}
        </ul>
      </ActionBottomSheet>
    );
  }

  return (
    <ActionBottomSheet
      open
      title="홈 화면에 앱으로 설치할까요?"
      description="설치하면 홈 화면 아이콘으로 바로 열 수 있고, 주소창 없이 더 앱처럼 사용할 수 있어요."
      primaryLabel="설치하기"
      secondaryLabel="나중에"
      onPrimary={onInstall}
      onClose={onClose}
      ariaLabel="홈 화면 앱 설치 확인"
    >
      <ul className="mt-4 space-y-2 text-[13px] text-ink-soft">
        <SheetGuideItem>프로필, 작성, 둘러보기를 홈 화면에서 바로 실행할 수 있어요</SheetGuideItem>
        <SheetGuideItem>설치해도 계정과 기록은 그대로 유지돼요</SheetGuideItem>
      </ul>
    </ActionBottomSheet>
  );
}

function isAppleDevice() {
  if (typeof navigator === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function SheetGuideItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2">
      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sunset" />
      <span>{children}</span>
    </li>
  );
}

function InstallIcon({ installed }: { installed: boolean }) {
  return (
    <svg width={ACTION_ICON_SIZE} height={ACTION_ICON_SIZE} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3v10m0 0 4-4m-4 4-4-4"
        stroke="currentColor"
        strokeWidth={ACTION_ICON_STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 14v3.5A2.5 2.5 0 0 0 7.5 20h9a2.5 2.5 0 0 0 2.5-2.5V14"
        stroke="currentColor"
        strokeWidth={ACTION_ICON_STROKE}
        strokeLinecap="round"
      />
      {installed && (
        <path
          d="m15.5 6.5 1.5 1.5 3-3"
          stroke="currentColor"
          strokeWidth={ACTION_ICON_STROKE}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Some Android WebViews expose the API but deny it. Fall back below.
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  try {
    if (!document.execCommand("copy")) {
      throw new Error("copy failed");
    }
  } finally {
    document.body.removeChild(textarea);
  }
}

function ShareIcon() {
  return (
    <svg width={ACTION_ICON_SIZE} height={ACTION_ICON_SIZE} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8.8 12.5 15.2 16M15.2 8 8.8 11.5M7 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Zm10 5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Zm0-10a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"
        stroke="currentColor"
        strokeWidth={ACTION_ICON_STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RefreshIcon({ spinning }: { spinning: boolean }) {
  return (
    <svg
      width={ACTION_ICON_SIZE}
      height={ACTION_ICON_SIZE}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={spinning ? "animate-spin" : undefined}
    >
      <path
        d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"
        stroke="currentColor"
        strokeWidth={ACTION_ICON_STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
