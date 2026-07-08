"use client";

import { useSyncExternalStore } from "react";
import JellyButton from "@/components/JellyButton";

type Theme = "light" | "dark";

const THEME_EVENT = "routdiary:theme";
const DEFAULT_THEME: Theme = "light";

function readTheme(): Theme {
  if (typeof document === "undefined") return DEFAULT_THEME;
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function subscribeTheme(onStoreChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === "theme") onStoreChange();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(THEME_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(THEME_EVENT, onStoreChange);
  };
}

/** Light/dark switch. Persists to localStorage and toggles `.dark` on <html>. */
export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribeTheme, readTheme, () => DEFAULT_THEME);

  const apply = (next: Theme) => {
    document.documentElement.classList.toggle("dark", next === "dark");
    try {
      localStorage.setItem("theme", next);
    } catch {}
    window.dispatchEvent(new Event(THEME_EVENT));
  };

  const isDark = theme === "dark";

  return (
    <div className="flex items-center justify-between border-b border-line px-4 py-3.5 text-[14px] text-ink last:border-0">
      <span className="flex items-center gap-2">
        {isDark ? <MoonIcon /> : <SunIcon />}
        다크 모드
      </span>
      <JellyButton
        type="button"
        role="switch"
        aria-checked={isDark}
        aria-label="다크 모드 전환"
        onClick={() => apply(isDark ? "light" : "dark")}
        className={`relative h-7 w-12 rounded-full transition-colors ${
          isDark ? "bg-sunset" : "bg-line"
        }`}
      >
        <span
          className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${
            isDark ? "left-[22px]" : "left-0.5"
          }`}
        />
      </JellyButton>
    </div>
  );
}

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
    </svg>
  );
}
