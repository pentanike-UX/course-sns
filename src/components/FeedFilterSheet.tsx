"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  THEME_OPTIONS,
  MOOD_LEVELS,
  RECOMMEND_OPTIONS,
  DIFFICULTY_OPTIONS,
} from "@/lib/meta-options";
import {
  REGION_OPTIONS,
  KIND_OPTIONS,
  EMPTY_FILTERS,
  filterCount,
  type FeedFilters,
} from "@/lib/feed-filters";

type Props = {
  open: boolean;
  /** the currently applied filters — seeds the draft */
  value: FeedFilters;
  /** live result count for a draft (list mode). Omitted on the map, where pins
   *  are fetched server-side per viewport so a total count isn't meaningful. */
  countFor?: (draft: FeedFilters) => number;
  /** show the 루트 종류(루트일기/계획) facet — list mode only (map pins lack purpose) */
  showKind?: boolean;
  onApply: (f: FeedFilters) => void;
  onClose: () => void;
};

/**
 * 둘러보기 필터 시트. Same modal-sheet UX as ChipSheet/MoodSheet (dim backdrop,
 * grabber, slide-up). Holds a draft until 적용 — themes/moods/regions are each
 * multi-select; the apply button shows the live match count.
 */
export default function FeedFilterSheet({ open, value, countFor, showKind, onApply, onClose }: Props) {
  if (!open) return null;
  return (
    <Panel value={value} countFor={countFor} showKind={showKind} onApply={onApply} onClose={onClose} />
  );
}

function Panel({ value, countFor, showKind, onApply, onClose }: Omit<Props, "open">) {
  const [draft, setDraft] = useState<FeedFilters>(value);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setShow(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const toggle = (kind: keyof FeedFilters, v: string) =>
    setDraft((d) => ({
      ...d,
      [kind]: d[kind].includes(v) ? d[kind].filter((x) => x !== v) : [...d[kind], v],
    }));

  const close = () => {
    setShow(false);
    window.setTimeout(onClose, 200);
  };
  const apply = () => {
    onApply(draft);
    close();
  };

  const total = filterCount(draft);
  const applyLabel = countFor ? `${countFor(draft)}개 코스 보기` : "필터 적용";

  return (
    <div className="fixed inset-0 z-50">
      <div
        className={`absolute inset-0 bg-black/30 transition-opacity duration-200 ${
          show ? "opacity-100" : "opacity-0"
        }`}
        onClick={close}
      />
      <div className="absolute inset-x-0 bottom-0 flex justify-center">
        <div
          className={`w-full max-w-[430px] rounded-t-3xl bg-card pb-[max(env(safe-area-inset-bottom),20px)] shadow-[0_-8px_30px_rgba(0,0,0,0.18)] transition-transform duration-200 ease-out ${
            show ? "translate-y-0" : "translate-y-full"
          }`}
        >
          <div className="px-4 pt-3">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line" />
            <div className="mb-1 flex items-center justify-between">
              <h3 className="text-[16px] font-bold text-ink">필터</h3>
              <div className="flex items-center gap-2">
                {total > 0 && (
                  <button
                    type="button"
                    onClick={() => setDraft(EMPTY_FILTERS)}
                    className="text-[13px] font-semibold text-ink-faint"
                  >
                    초기화
                  </button>
                )}
                <button
                  type="button"
                  onClick={close}
                  aria-label="닫기"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-ink-soft"
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M6 6 18 18M18 6 6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div className="no-scrollbar max-h-[56vh] overflow-y-auto px-4 pb-2">
            {showKind && (
              <Section title="코스 종류">
                {KIND_OPTIONS.map((k) => (
                  <Chip
                    key={k.value}
                    active={draft.kinds.includes(k.value)}
                    onClick={() => toggle("kinds", k.value)}
                  >
                    {k.label}
                  </Chip>
                ))}
              </Section>
            )}
            <Section title="누구와 · 무엇을">
              {RECOMMEND_OPTIONS.map((p) => (
                <Chip
                  key={p}
                  active={draft.purposes.includes(p)}
                  onClick={() => toggle("purposes", p)}
                >
                  {p}
                </Chip>
              ))}
            </Section>
            <Section title="난이도">
              {DIFFICULTY_OPTIONS.map((d) => (
                <Chip
                  key={d.key}
                  active={draft.difficulties.includes(d.key)}
                  onClick={() => toggle("difficulties", d.key)}
                >
                  {d.label}
                </Chip>
              ))}
            </Section>
            <Section title="테마">
              {THEME_OPTIONS.map((t) => (
                <Chip key={t} active={draft.themes.includes(t)} onClick={() => toggle("themes", t)}>
                  {t}
                </Chip>
              ))}
            </Section>
            <Section title="감정">
              {MOOD_LEVELS.map((m) => (
                <Chip
                  key={m.key}
                  active={draft.moods.includes(m.label)}
                  onClick={() => toggle("moods", m.label)}
                >
                  <span className="mr-1">{m.emoji}</span>
                  {m.label}
                </Chip>
              ))}
            </Section>
            <Section title="지역">
              {REGION_OPTIONS.map((r) => (
                <Chip
                  key={r.label}
                  active={draft.regions.includes(r.label)}
                  onClick={() => toggle("regions", r.label)}
                >
                  {r.label}
                </Chip>
              ))}
            </Section>
          </div>

          <div className="px-4 pt-2">
            <button
              type="button"
              onClick={apply}
              className="w-full rounded-xl bg-sunset py-3.5 text-[15px] font-semibold text-white"
            >
              {applyLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="border-b border-line py-4 last:border-0">
      <h4 className="mb-2.5 text-[13px] font-bold text-ink-soft">{title}</h4>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full px-3.5 py-2 text-[13px] font-medium transition-colors ${
        active ? "bg-ink text-paper" : "bg-muted text-ink-soft"
      }`}
    >
      {children}
    </button>
  );
}
