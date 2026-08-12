import { DocTable, H2, H3, Note, P, PageHeader, StatusPill, Ul, Warn } from "../_components/ui";

export default function StatusPage() {
  return (
    <>
      <PageHeader
        title="현황"
        description="실서비스에서 지금 제공 중인 기능, 남은 과제, 인수 후 확인할 항목입니다."
      />

      <H2>한 줄 요약</H2>
      <P>
        코스 MVP의 북스타 루프와 시나리오 Wave G1–G6·단계별 심층 검수(v0.3.24–25)까지 코드
        반영된 상태입니다. 남은 과제는{" "}
        <strong className="font-semibold text-ink">운영 설정·실기기 검증</strong>입니다.
      </P>

      <div className="mt-4 flex flex-wrap gap-2">
        <StatusPill tone="ok">핵심 루프 제공 중</StatusPill>
        <StatusPill tone="ok">시나리오 G1–G6 코드 완료</StatusPill>
        <StatusPill tone="warn">0014 DB · env 확인</StatusPill>
      </div>

      <H2>사용자가 지금 할 수 있는 것</H2>
      <H3>발견·탐색</H3>
      <DocTable
        headers={["기능", "상태", "메모"]}
        rows={[
          ["공개 코스 피드", "✅ 완료", "전이 정렬·필터"],
          ["지도 탐색", "✅ 완료", "스펙+전이 peek · 게스트 refetch"],
          ["게스트 열람", "✅ 완료", "AuthGate 쓰기"],
          ["구독 홈 레일", "✅ 완료", "로그인 시 empty도 슬롯 노출"],
        ]}
      />
      <H3>따라가기 루프</H3>
      <DocTable
        headers={["기능", "상태", "메모"]}
        rows={[
          ["따라가기 복제", "✅ 완료", "비공개 초안"],
          ["다녀왔어요·후기", "✅ 완료", "CTA 톤 사다리"],
          ["진행 체크리스트", "✅ 완료", "실데이터 기반"],
          ["저장 → 따라가기", "✅ 완료", "보관함 카드 CTA"],
        ]}
      />
      <H3>만들기·영향력</H3>
      <DocTable
        headers={["기능", "상태", "메모"]}
        rows={[
          ["기록·계획 작성", "✅ 완료", "공개 게이트"],
          ["따라가기 준비도", "✅ 완료", "soft hint + 공개 soft confirm"],
          ["전이 통계", "✅ 완료", "0명 노출 · 코스 지역"],
          ["장소 검색", "⚠️ 부분", "키 미설정 시 UI 숨김"],
        ]}
      />
      <H3>구독·소통</H3>
      <DocTable
        headers={["기능", "상태", "메모"]}
        rows={[
          ["팔로우", "✅ 완료", "맞팔 라벨"],
          ["구독 코스", "✅ 완료", "보관함 탭 · FOL"],
          ["알림 그룹", "✅ 완료", "전이·소셜"],
          ["copy/publish 알림", "⚠️ DB 확인", "0014 push"],
          ["좋아요·댓글", "✅ 완료", "보조 위계"],
        ]}
      />

      <H2>인수 후 체크리스트 (운영)</H2>
      <Ul>
        <li>
          Supabase Auth →{" "}
          <strong className="font-semibold text-ink">이메일 확인 off</strong> (개발) 또는 실제
          메일 가입 플로우 점검
        </li>
        <li>
          Supabase에 <code className="rounded bg-muted px-1 text-[12px]">0014</code> ·{" "}
          <code className="rounded bg-muted px-1 text-[12px]">0015</code> 적용 여부
        </li>
        <li>
          Vercel Production:{" "}
          <code className="rounded bg-muted px-1 text-[12px]">NAVER_SEARCH_*</code> ·{" "}
          <code className="rounded bg-muted px-1 text-[12px]">NEXT_PUBLIC_SITE_URL</code>
        </li>
        <li>NCP Maps Web URL에 <code className="rounded bg-muted px-1 text-[12px]">course-sns.vercel.app</code></li>
        <li>Google OAuth 콜백이 course-sns Supabase를 가리키는지</li>
        <li>
          실기기: 게스트 + → Google → 작성 → 상세 → Back ≠ 로그인 · 지도 타일 · 팔로우 루프
        </li>
        <li>
          로컬 <code className="rounded bg-muted px-1 text-[12px]">.env.local</code> 후{" "}
          <code className="rounded bg-muted px-1 text-[12px]">pnpm test:e2e</code>
        </li>
        <li>
          <code className="rounded bg-muted px-1 text-[12px]">/deliverables</code> 가이드 링크
          공유
        </li>
      </Ul>

      <H2>의도적으로 미구현</H2>
      <Ul>
        <li>결제·구독 상품</li>
        <li>
          DB/URL <code className="rounded bg-muted px-1 text-[12px]">routes→courses</code> rename
        </li>
        <li>추천 알고리즘·푸시 네이티브</li>
      </Ul>

      <Warn>
        routdiary 프로덕션·Supabase와 키·데이터를 섞지 마세요. 인프라는 완전 분리입니다.
      </Warn>
      <Note>
        시나리오 페인포인트:{" "}
        <code className="rounded bg-muted px-1 text-[12px]">/deliverables/scenario-painpoints</code>
        . 단계별 심층 검수:{" "}
        <code className="rounded bg-muted px-1 text-[12px]">
          docs/PERSONA-SCENARIO-STEP-AUDIT-2026-08.md
        </code>
        . 로그:{" "}
        <code className="rounded bg-muted px-1 text-[12px]">docs/HANDOFF.md</code> §7.
      </Note>
    </>
  );
}
