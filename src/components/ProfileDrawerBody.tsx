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
  counts: { saved: number; liked: number; followers: number };
  defaultVisibility: Visibility;
}) {
  const publicCount = routes.filter((r) => r.visibility === "public").length;
  const copyTotal = routes.reduce((sum, r) => sum + (r.copyCount ?? 0), 0);
  const completionTotal = routes.reduce((sum, r) => sum + (r.completionCount ?? 0), 0);
  // STAT-01: own drawer — avoid diary「여행자」fallback
  const displayName = profile?.displayName?.trim() || "나";
  const handle = profile?.handle;

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
        {handle && <p className="text-[13px] text-ink-faint">@{handle}</p>}
        {copyTotal > 0 && (
          <p className="mt-2 text-center text-[12px] font-medium text-ink-soft">
            내 코스를 {copyTotal}명이 따라갔어요
          </p>
        )}
        <Link
          href="/profile/edit"
          className="mt-3 rounded-full border border-line px-4 py-1.5 text-[13px] font-semibold text-ink-soft"
        >
          프로필 편집
        </Link>
      </section>

      {/* Transfer / influence first — 저장 is not a front-row maker metric (STAT-01) */}
      <section className="mx-4 mt-4 grid grid-cols-4 divide-x divide-line rounded-[var(--radius-card)] border border-line bg-card py-4 text-center">
        <Stat label="따라감" value={copyTotal} />
        <Stat label="다녀옴" value={completionTotal} />
        <Stat label="공개" value={publicCount} />
        <Stat
          label="팔로워"
          value={counts.followers}
          href={handle ? `/u/${handle}/followers` : undefined}
        />
      </section>

      <Link
        href="/profile/stats"
        className="mx-4 mt-3 flex items-center justify-between rounded-[var(--radius-card)] border border-line bg-card px-4 py-3.5 text-[14px] font-semibold text-ink"
      >
        <span className="flex items-center gap-2">
          <ChartIcon /> 내 코스 통계
        </span>
        <span className="flex items-center gap-1 font-normal text-ink-faint">
          따라감 · 다녀옴 · 지역
          <ChevronRightIcon />
        </span>
      </Link>

      {handle && (
        <Link
          href={`/u/${handle}`}
          className="mx-4 mt-2 flex items-center justify-between rounded-[var(--radius-card)] border border-line bg-card px-4 py-3 text-[13px] font-semibold text-ink-soft"
        >
          <span>내 책장 보기</span>
          <ChevronRightIcon />
        </Link>
      )}

      <section className="px-4 pt-6">
        <h3 className="text-[14px] font-bold text-ink">설정</h3>
        <ul className="mt-2 overflow-hidden rounded-[var(--radius-card)] border border-line bg-card">
          <ThemeToggle />
          <SettingLink href="/profile/account" label="계정 정보" />
          <DefaultVisibilitySetting initial={defaultVisibility} />
          <SettingLink href="/library?tab=saved" label={`저장한 코스${counts.saved ? ` · ${counts.saved}` : ""}`} />
          <SettingLink href="/notifications" label="알림" />
          <SettingLink href="/profile/help" label="도움말" />
        </ul>

        <p className="mt-6 text-center text-[12px] text-ink-faint">
          coursee · 따라갈 수 있는 이동 코스
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
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function Stat({
  label,
  value,
  href,
}: {
  label: string;
  value: number;
  href?: string;
}) {
  const inner = (
    <>
      <p className="text-[17px] font-black tabular-nums text-ink">{value}</p>
      <p className="mt-0.5 text-[11px] font-medium text-ink-faint">{label}</p>
    </>
  );
  if (href) {
    return (
      <Link href={href} className="px-1 transition-opacity active:opacity-70">
        {inner}
      </Link>
    );
  }
  return <div className="px-1">{inner}</div>;
}

function SettingLink({ href, label }: { href: string; label: string }) {
  return (
    <li className="border-t border-line first:border-t-0">
      <Link
        href={href}
        className="flex items-center justify-between px-4 py-3.5 text-[14px] font-medium text-ink"
      >
        {label}
        <ChevronRightIcon />
      </Link>
    </li>
  );
}
