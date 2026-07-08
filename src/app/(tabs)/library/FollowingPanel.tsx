"use client";

import { useEffect, useRef, useState } from "react";
import PersonRow from "@/components/PersonRow";
import type { PersonSummary } from "@/lib/data";

/**
 * 보관함 > 팔로잉: 내가 팔로우한 회원 카드 + 회원 검색(친구 찾기).
 * 검색어가 없으면 팔로잉 목록을, 2글자 이상 입력하면 전체 공개 회원을
 * 이름/@아이디로 타이프어헤드 검색한다(`/api/people`). 결과 행은 프로필
 * 어디서나 쓰는 PersonRow(아바타·이름·@핸들·인라인 팔로우)를 그대로 사용.
 */
export default function FollowingPanel({
  following,
}: {
  following: PersonSummary[];
}) {
  const [text, setText] = useState("");
  const [results, setResults] = useState<PersonSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const reqRef = useRef(0);

  const term = text.trim();
  const searching = term.length >= 2;

  useEffect(() => {
    if (term.length < 2) return;
    const id = ++reqRef.current;
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/people?q=${encodeURIComponent(term)}`);
        const json = (await res.json()) as { people?: PersonSummary[] };
        if (id === reqRef.current) setResults(json.people ?? []);
      } catch {
        if (id === reqRef.current) setResults([]);
      } finally {
        if (id === reqRef.current) setLoading(false);
      }
    }, 280);
    return () => clearTimeout(t);
  }, [term]);

  return (
    <div className="px-4 pb-8 pt-3">
      <div className="flex items-center gap-2 rounded-full border border-line bg-card px-3.5 py-2.5 shadow-[var(--shadow-sm)]">
        <SearchIcon />
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="이름 또는 @아이디로 회원 검색"
          aria-label="회원 검색"
          enterKeyHint="search"
          className="w-full bg-transparent text-[14px] text-ink outline-none placeholder:text-ink-faint"
        />
        {text && (
          <button
            type="button"
            onClick={() => setText("")}
            aria-label="지우기"
            className="text-ink-faint"
          >
            <ClearIcon />
          </button>
        )}
      </div>

      {searching ? (
        loading && results.length === 0 ? (
          <Spinner />
        ) : results.length === 0 ? (
          <NoResult term={term} />
        ) : (
          <ul className="mt-4 space-y-2">
            {results.map((p) => (
              <li key={p.id}>
                <PersonRow person={p} />
              </li>
            ))}
          </ul>
        )
      ) : following.length === 0 ? (
        <FollowingEmpty />
      ) : (
        <ul className="mt-4 space-y-2">
          {following.map((p) => (
            <li key={p.id}>
              <PersonRow person={p} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex justify-center py-14" role="status" aria-label="검색 중">
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-line border-t-ink-soft" />
    </div>
  );
}

function NoResult({ term }: { term: string }) {
  return (
    <div className="px-8 py-14 text-center text-[13px] leading-relaxed text-ink-faint">
      ‘{term}’과 일치하는 회원이 없어요.
      <br />
      이름이나 @아이디를 다시 확인해 보세요.
    </div>
  );
}

function FollowingEmpty() {
  return (
    <div className="flex flex-col items-center px-8 py-14 text-center">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        <UsersIcon />
      </div>
      <p className="text-[14px] font-semibold text-ink">아직 팔로우한 회원이 없어요</p>
      <p className="mt-1 text-[13px] leading-relaxed text-ink-faint">
        위 검색으로 친구를 찾아
        <br />
        팔로우하면 여기에 모여요.
      </p>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0">
      <circle cx="11" cy="11" r="7" stroke="var(--ink-faint)" strokeWidth="1.8" />
      <path d="m20 20-3.2-3.2" stroke="var(--ink-faint)" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function ClearIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--ink-soft)" strokeWidth="1.8">
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" strokeLinecap="round" />
      <path d="M16 5.2a3.2 3.2 0 0 1 0 5.6M17.5 14c2.4.3 4 2.3 4 5" strokeLinecap="round" />
    </svg>
  );
}
