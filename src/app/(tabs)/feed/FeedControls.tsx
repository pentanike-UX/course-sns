"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import JellyButton from "@/components/JellyButton";
import type { FeedSort } from "@/lib/data";
import { appendFilterParams, filterCount, kindLabel, type FeedFilters } from "@/lib/feed-filters";
import { moodByLabel } from "@/lib/meta-options";

export type FeedView = "all" | "following";
export type FeedMode = "list" | "map";
export type FeedLayout = "grid" | "small" | "large";
/** "distance" (거리순) is a client-only sort by the user's current location. */
export type FeedSortClient = FeedSort | "distance";
type Props = {
  sort: FeedSortClient;
  layout: FeedLayout;
  q: string;
  filters: FeedFilters;
  onLayoutChange: (layout: FeedLayout) => void;
  onOpenFilter: () => void;
  onRemoveFilter: (kind: keyof FeedFilters, value: string) => void;
};

export default function FeedControls({
  sort,
  layout,
  q,
  filters,
  onLayoutChange,
  onOpenFilter,
  onRemoveFilter,
}: Props) {
  const router = useRouter();

  const sortUrl = (next: FeedSortClient) => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (next !== "recent") params.set("sort", next);
    appendFilterParams(params, filters);
    return `/${params.toString() ? `?${params}` : ""}`;
  };

  const activeCount = filterCount(filters);

  return (
    // The filter/sort/layout toolbar. It lives inside the explore header's sticky
    // container (FeedExplorer), which pins it to the top while the identity row
    // above it auto-hides on scroll — so the filters stay reachable throughout.
    <div className="bg-paper/95 px-4 pb-2 pt-2 backdrop-blur">
      {/* 필터 · 최신순 · 인기순 · 거리순 — 보기 유형 */}
      <div className="flex items-center gap-2">
        <FilterButton count={activeCount} onClick={onOpenFilter} />
        <div className="no-scrollbar flex min-w-0 items-center gap-1.5 overflow-x-auto">
          <SortChip
            label="최신순"
            active={sort === "recent"}
            onClick={() => router.replace(sortUrl("recent"))}
          />
          <SortChip
            label="인기순"
            active={sort === "popular"}
            onClick={() => router.replace(sortUrl("popular"))}
          />
          <SortChip
            label="거리순"
            active={sort === "distance"}
            onClick={() => router.replace(sortUrl("distance"))}
          />
        </div>
        <div
          className="ml-auto flex shrink-0 rounded-full bg-muted p-1"
          aria-label="보기 방식"
        >
          <LayoutButton
            label="그리드형"
            active={layout === "grid"}
            onClick={() => onLayoutChange("grid")}
          >
            <GridIcon />
          </LayoutButton>
          <LayoutButton
            label="작은 이미지 리스트"
            active={layout === "small"}
            onClick={() => onLayoutChange("small")}
          >
            <SmallListIcon />
          </LayoutButton>
          <LayoutButton
            label="큰 이미지 리스트"
            active={layout === "large"}
            onClick={() => onLayoutChange("large")}
          >
            <LargeListIcon />
          </LayoutButton>
        </div>
      </div>
      {activeCount > 0 && <ActiveFilterChips filters={filters} onRemove={onRemoveFilter} />}
    </div>
  );
}

function FilterButton({ count, onClick }: { count: number; onClick: () => void }) {
  const active = count > 0;
  return (
    <JellyButton
      type="button"
      onClick={onClick}
      aria-label={active ? `필터 ${count}개 적용됨` : "필터"}
      className={`flex h-8 shrink-0 items-center gap-1 rounded-full px-3 text-[13px] font-bold transition-colors ${
        active ? "bg-ink text-paper" : "bg-muted text-ink-soft"
      }`}
    >
      <FilterIcon />
      {active && <span>{count}</span>}
    </JellyButton>
  );
}

function ActiveFilterChips({
  filters,
  onRemove,
}: {
  filters: FeedFilters;
  onRemove: (kind: keyof FeedFilters, value: string) => void;
}) {
  const items: { kind: keyof FeedFilters; value: string; label: string }[] = [
    ...(filters.kinds ?? []).map((v) => ({ kind: "kinds" as const, value: v, label: kindLabel(v) })),
    ...filters.themes.map((v) => ({ kind: "themes" as const, value: v, label: v })),
    ...filters.moods.map((v) => ({
      kind: "moods" as const,
      value: v,
      label: `${moodByLabel(v)?.emoji ?? ""} ${v}`.trim(),
    })),
    ...filters.regions.map((v) => ({ kind: "regions" as const, value: v, label: v })),
  ];
  return (
    <div className="no-scrollbar -mx-4 mt-2.5 flex gap-2 overflow-x-auto px-4">
      {items.map((it) => (
        <button
          key={`${it.kind}:${it.value}`}
          type="button"
          onClick={() => onRemove(it.kind, it.value)}
          className="flex shrink-0 items-center gap-1 rounded-full bg-muted py-1.5 pl-3 pr-2 text-[12px] font-semibold text-ink-soft ring-1 ring-line"
          aria-label={`${it.value} 필터 제거`}
        >
          {it.label}
          <CloseX />
        </button>
      ))}
    </div>
  );
}

function FilterIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path d="M4 7h8M17 7h3M4 17h3M12 17h8" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <circle cx="14.5" cy="7" r="2.3" stroke="currentColor" strokeWidth="1.9" />
      <circle cx="9.5" cy="17" r="2.3" stroke="currentColor" strokeWidth="1.9" />
    </svg>
  );
}

function CloseX() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function LayoutButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <JellyButton
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={active}
      onClick={onClick}
      className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-200 ${
        active
          ? "bg-card text-ink shadow-[var(--shadow-sm)]"
          : "text-ink-faint"
      }`}
    >
      {children}
    </JellyButton>
  );
}

function SortChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
        active ? "bg-ink text-paper" : "bg-muted text-ink-soft"
      }`}
    >
      {label}
    </button>
  );
}

function GridIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <rect x="4" y="4" width="6.5" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function SmallListIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <rect x="4" y="5" width="5" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 6.2h8M12 9h5.5M12 15.2h8M12 18h5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <rect x="4" y="14" width="5" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function LargeListIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <rect x="4" y="4" width="16" height="8" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5 16h14M5 19h9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
