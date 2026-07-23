import { Code, DocTable, H2, Note, P, PageHeader, Ul } from "../_components/ui";
import { APP_VERSION } from "@/lib/version";

export default function ChangelogPage() {
  return (
    <>
      <PageHeader
        title="이력"
        description="버전별 주요 변경입니다. 상세 작업 로그는 docs/HANDOFF.md §7에 누적합니다."
      />

      <P>
        현재 버전: <Code>{APP_VERSION}</Code>
      </P>

      <H2>v0.3.0-mvp — Wave E</H2>
      <Ul>
        <li>상세 전이 CTA를 좋아요/저장보다 위</li>
        <li>콜드 카드·지도 peek SpecLine 패리티 · `첫 따라가기`</li>
        <li>FollowProgressBar 실데이터 · 저장함 뱃지 차별</li>
        <li>알림 `copy` · `course_publish` (0014) · 홈 팔로잉 레일</li>
        <li>`--error` brand와 분리 · 통계 타이틀 코스 통계</li>
      </Ul>

      <H2>v0.2.0-mvp — Waves A–D · 공개 게이트</H2>
      <Ul>
        <li>A: 보관함 스택 아이콘 · peek/카드 전이 프루프 · error-soft</li>
        <li>B: CTA 톤 사다리 · 저장「따라가기」· AuthGate 전이 카피 · popular 퇴장</li>
        <li>C: success teal · 플래너 레드 예산 · walk slate</li>
        <li>D: 프로필 전이 지표 · 알림 그룹 · FollowReadyHint</li>
        <li>공개/비공개 명시 선택 (`visibilityChosen`)</li>
      </Ul>

      <H2>v0.1.0-mvp — fork 초기</H2>
      <Ul>
        <li>routdiary v1.14.21 fork · 인프라 분리</li>
        <li>브랜드 레드 + 뉴트럴 · 코스 카피·IA Phase 0–3</li>
        <li>따라가기·완주·보관함 IA</li>
      </Ul>

      <H2>문서·브랜드</H2>
      <DocTable
        headers={["항목", "내용"]}
        rows={[
          ["/deliverables", "개발·운영 가이드 (이 사이트)"],
          ["아이콘·favicon·OG", "코스 C 마크 통일 (그린 routdiary 잔상 제거)"],
          ["정본 docs", "HANDOFF · DESIGN-SYSTEM · COURSE-UX · UX-PERSONA"],
        ]}
      />

      <Note>
        SemVer는 <Code>src/lib/version.ts</Code>의 <Code>APP_VERSION</Code>이 단일 출처입니다.
        UI·토큰 변경 시 HANDOFF §7에 맥락을 남기세요.
      </Note>
    </>
  );
}
