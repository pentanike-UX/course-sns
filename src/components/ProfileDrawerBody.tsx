import Image from "next/image";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { APP_VERSION } from "@/lib/version";
import DefaultVisibilitySetting from "@/app/(tabs)/profile/DefaultVisibilitySetting";
import type { RouteAuthor, RouteSummary, Visibility } from "@/lib/types";

/**
 * The body of the profile drawer (avatar, stats, settings). Extracted so it can
 * be rendered both as the routed /profile drawer AND as a live overlay stacked
 * on top of the 내 코스 drawer (feed → profile) without unmounting feed.
 */
export default function ProfileDrawerBody({
  routes,
  profile,
  counts,
  defaultVisibility,
}: {
  routes: RouteSummary[];
  profile: RouteAuthor | null;
  counts: { saved: number; liked: number };
  defaultVisibility: Visibility;
}) {
  const publicCount = routes.filter((r) => r.visibility === "public").length;
  const displayName = profile?.displayName ?? "여행자";

  return (
    <>
      <section className="flex flex-col items-center px-4 pb-2 pt-6">
        <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-sunset-wash ring-2 ring-sunset/30">
          {profile?.avatarUrl ? (
            <Image src={profile.avatarUrl} alt={displayName} fill sizes="80px" className="object-cover" />
          ) : (
            <span className="text-2xl font-black text-sunset">{displayName.charAt(0)}</span>
          )}
        </div>
        <h2 className="mt-3 text-lg font-bold text-ink">{displayName}</h2>
        {profile?.handle && <p className="text-[13px] text-ink-faint">@{profile.handle}</p>}
        <Link
          href="/profile/edit"
          className="mt-3 rounded-full border border-line px-4 py-1.5 text-[13px] font-semibold text-ink-soft"
        >
          프로필 편집
        </Link>
      </section>

      <section className="mx-4 mt-4 grid grid-cols-4 divide-x divide-line rounded-[var(--radius-card)] border border-line bg-card py-4 text-center">
        <Stat label="코스" value={routes.length} />
        <Stat label="공개" value={publicCount} />
        <Stat label="저장" value={counts.saved} href="/library?tab=saved" />
        <Stat label="좋아요" value={counts.liked} href="/library?tab=liked" />
      </section>

      <Link
        href="/profile/stats"
        className="mx-4 mt-3 flex items-center justify-between rounded-[var(--radius-card)] border border-line bg-card px-4 py-3.5 text-[14px] font-semibold text-ink"
      >
        <span className="flex items-center gap-2">
          <ChartIcon /> 여행 통계
        </span>
        <span className="flex items-center gap-1 font-normal text-ink-faint">
          다녀온 지역 · 월별 기록
          <ChevronRightIcon />
        </span>
      </Link>

      <section className="px-4 pt-6">
        <h3 className="text-[14px] font-bold text-ink">설정</h3>
        <ul className="mt-2 overflow-hidden rounded-[var(--radius-card)] border border-line bg-card">
          <ThemeToggle />
          <SettingLink href="/profile/account" label="계정 정보" />
          <DefaultVisibilitySetting initial={defaultVisibility} />
          <SettingRow label="알림" badge="준비 중" />
          <SettingLink href="/profile/help" label="도움말" />
        </ul>

        <p className="mt-6 text-center text-[12px] text-ink-faint">
          코스 · 갔다 온 길을 따라갈 수 있게
          <br />
          <span className="text-[11px]">{APP_VERSION}</span>
        </p>
      </section>
    </>
  );
}

function ChartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M5 20V10m7 10V4m7 16v-7"
        stroke="var(--brand-primary)"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SettingLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between border-b border-line px-4 py-3.5 text-[14px] text-ink last:border-0"
    >
      {label}
      <ChevronRightIcon />
    </Link>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" className="shrink-0 text-ink-faint" aria-hidden>
      <path
        d="m9 5 7 7-7 7"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SettingRow({ label, badge }: { label: string; badge?: string }) {
  return (
    <div className="flex items-center justify-between border-b border-line px-4 py-3.5 text-[14px] text-ink-faint last:border-0">
      {label}
      {badge && (
        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-ink-faint">
          {badge}
        </span>
      )}
    </div>
  );
}

function Stat({ label, value, href }: { label: string; value: number; href?: string }) {
  const inner = (
    <>
      <div className="text-lg font-black text-ink">{value}</div>
      <div className="text-[12px] text-ink-faint">{label}</div>
    </>
  );
  return href ? (
    <Link href={href} className="block">
      {inner}
    </Link>
  ) : (
    <div>{inner}</div>
  );
}
