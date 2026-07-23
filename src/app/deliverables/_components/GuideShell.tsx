"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { APP_VERSION } from "@/lib/version";
import { GUIDE_NAV, GUIDE_TITLE, PROD_URL } from "./nav";

export default function GuideShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-lvh bg-[var(--stage)] text-ink">
      <header className="sticky top-0 z-50 border-b border-line bg-paper/90 backdrop-blur-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/deliverables"
              className="flex h-9 w-9 shrink-0 overflow-hidden rounded-[10px] shadow-sm ring-1 ring-black/10"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/icons/icon-512.png"
                alt="코스"
                width={36}
                height={36}
                className="h-full w-full object-cover"
              />
            </Link>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold tracking-tight">{GUIDE_TITLE}</p>
              <p className="truncate text-xs text-ink-faint">
                공식 운영·개발 문서 · {APP_VERSION}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <a
              href={PROD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden rounded-lg border border-line px-3 py-1.5 text-xs text-ink-soft transition hover:bg-muted sm:inline-block"
            >
              프로덕션 앱 ↗
            </a>
            <Link
              href="/"
              className="rounded-lg bg-sunset px-3 py-1.5 text-xs font-medium text-paper transition hover:opacity-90"
            >
              앱으로
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl gap-0 px-4 py-6 sm:gap-8 sm:px-6">
        <aside className="hidden w-56 shrink-0 lg:block">
          <nav className="sticky top-[4.5rem] space-y-1">
            {GUIDE_NAV.map((item) => {
              const active =
                item.href === "/deliverables"
                  ? pathname === "/deliverables"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block rounded-xl px-3 py-2.5 transition ${
                    active
                      ? "bg-paper shadow-[var(--shadow-card)] ring-1 ring-line"
                      : "text-ink-soft hover:bg-paper/60"
                  }`}
                >
                  <span className="block text-sm font-semibold text-ink">{item.label}</span>
                  <span className="block text-[11px] text-ink-faint">{item.blurb}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 flex-1">
          <nav className="mb-6 flex gap-2 overflow-x-auto pb-1 lg:hidden">
            {GUIDE_NAV.map((item) => {
              const active =
                item.href === "/deliverables"
                  ? pathname === "/deliverables"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    active
                      ? "bg-ink text-paper"
                      : "bg-paper text-ink-soft ring-1 ring-line"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <article className="rounded-2xl border border-line bg-paper px-5 py-8 shadow-[var(--shadow-sm)] sm:px-8 sm:py-10">
            {children}
          </article>
          <footer className="mt-8 pb-10 text-center text-[12px] text-ink-faint">
            코스 (course-sns) · {APP_VERSION} · 정본 문서는 저장소{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-[11px]">docs/</code>
          </footer>
        </main>
      </div>
    </div>
  );
}
